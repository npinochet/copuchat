package redis

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gomodule/redigo/redis"
)

const (
	DefaultURL           = "localhost:6379"
	idleTimeout          = 5 * time.Minute
	maxIdle              = 10
	hourMinuteTimeLayout = "15:04"
)

var (
	RoomMaxMessages     = 200
	TopSubRoomsMaxSize  = 100
	InactiveUserTimeout = 1 * time.Hour
	InactiveWindowSize  = InactiveUserTimeout / 2

	TestOnBorrowTimeout = 1 * time.Minute
	pool                *redis.Pool
)

func init() {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		url = fmt.Sprintf("redis://%s", DefaultURL)
		log.Println("REDIS_URL env var not set, using localhost")
	}

	pool = &redis.Pool{
		MaxIdle:     maxIdle,
		IdleTimeout: idleTimeout,
		Dial:        func() (redis.Conn, error) { return redis.DialURL(url, redis.DialTLSSkipVerify(true)) },
		TestOnBorrow: func(c redis.Conn, t time.Time) error {
			if time.Since(t) < TestOnBorrowTimeout {
				return nil
			}
			_, err := c.Do("PING")

			return err
		},
	}

	conn := pool.Get()
	defer conn.Close()
	if _, err := conn.Do("PING"); err != nil {
		log.Panicf("redis: could not connect: %s", err)
	}
}

func chatKey(roomName string) string               { return "chat:" + roomName }
func topicKey(roomName string) string              { return "topic:" + roomName }
func subRoomsKey(roomName string) string           { return "subs:" + roomName }
func activeUserKey(roomName, window string) string { return "chatters:" + roomName + window }

func GetLastMessages(roomName string) ([]Message, error) {
	conn := pool.Get()
	defer conn.Close()

	values, err := redis.Values(conn.Do("XREVRANGE", chatKey(roomName), "+", "-", "COUNT", RoomMaxMessages))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get messages for %s: %w", roomName, err)
	}

	messages := make([]Message, len(values))
	for i, entryAny := range values {
		entry, _ := entryAny.([]any)
		key, _ := entry[0].([]byte)
		timestamp, err := strconv.ParseInt(strings.Split(string(key), "-")[0], 10, 64)
		if err != nil {
			return nil, fmt.Errorf("redis: error, could not parse timestamp %s: %w", key, err)
		}
		sm, _ := redis.StringMap(entry[1], nil)
		messages[len(values)-1-i] = Message{sm["user"], sm["text"], timestamp}
	}

	return messages, nil
}

func AddMessage(message *Message, roomName string) (bool, error) {
	conn := pool.Get()
	defer conn.Close()

	key, err := redis.String(conn.Do(
		"XADD", chatKey(roomName), "NOMKSTREAM", "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text,
	))
	newRoom := errors.Is(err, redis.ErrNil)
	if err != nil && !newRoom {
		return false, fmt.Errorf("redis: error, could not save message: %w", err)
	}

	if newRoom {
		if err := createRoom(message, roomName); err != nil {
			return false, err
		}
	} else {
		message.Timestamp, err = strconv.ParseInt(strings.Split(key, "-")[0], 10, 64)
		if err != nil {
			return false, fmt.Errorf("redis: error, could not parse given timestamp %s: %w", key, err)
		}
	}

	return newRoom, registerUserActivity(roomName, message)
}

func GetActiveUsersLen(roomName string) (int, error) {
	return updateUserActivity(roomName)
}

func GetActiveUsers(roomName string) ([]string, error) {
	conn := pool.Get()
	defer conn.Close()

	windows := int(InactiveUserTimeout / InactiveWindowSize)
	keys := make([]any, windows)

	now := time.Now().Truncate(InactiveWindowSize)
	for i := 0; i < int(InactiveUserTimeout/InactiveWindowSize); i++ {
		windowKey := now.Add(time.Duration(-i) * InactiveWindowSize).Format("15:04")
		keys[i] = activeUserKey(roomName, windowKey)
	}
	userNames, err := redis.Strings(conn.Do("SUNION", keys...))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get active users on room %s: %w", roomName, err)
	}

	return userNames, nil
}

func GetTopSubRooms(roomName string) ([]ActiveUsersLen, error) {
	conn := pool.Get()
	defer conn.Close()

	subRoomNames, err := redis.Strings(conn.Do("ZRANGE", subRoomsKey(roomName), 0, -1)) // TODO: Check all? or some maybe max TopSubRoomsMaxSize?
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get %s sub room keys: %w", roomName, err)
	}
	if len(subRoomNames) == 0 {
		return nil, nil
	}

	for _, subRoom := range subRoomNames {
		if _, err := updateUserActivity(subRoom); err != nil {
			return nil, err
		}
	}
	subRoomsStrings, err := redis.Strings(conn.Do("ZRANGE", subRoomsKey(roomName), 0, TopSubRoomsMaxSize, "REV", "WITHSCORES"))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get %s top sub rooms: %w", roomName, err)
	}

	subRooms := make([]ActiveUsersLen, len(subRoomsStrings)/2)
	for i := 0; i < len(subRoomsStrings); i += 2 {
		subRooms[i].RoomName = subRoomsStrings[i]
		subRooms[i].ActiveUsersLen, err = strconv.Atoi(subRoomsStrings[i+1])
		if err != nil {
			return nil, fmt.Errorf("redis: error, could not parse users len %s: %w", subRoomsStrings[i+1], err)
		}
	}

	return subRooms, nil
}

func SetTopic(roomName, topic string) error {
	conn := pool.Get()
	defer conn.Close()

	exists, err := redis.Bool(conn.Do("EXISTS", chatKey(roomName)))
	if err != nil {
		return fmt.Errorf("redis: error, could not check if room %s exists: %w", roomName, err)
	}
	if !exists {
		return fmt.Errorf("redis: error, room %s does not exists can not set topic: %w", roomName, err)
	}
	if _, err := conn.Do("SET", topicKey(roomName), topic); err != nil {
		return fmt.Errorf("redis: error, could not set topic for %s: %w", roomName, err)
	}

	return nil
}

func GetTopic(roomName string) (string, error) {
	conn := pool.Get()
	defer conn.Close()

	topic, err := redis.String(conn.Do("GET", topicKey(roomName)))
	if err != nil {
		return "", fmt.Errorf("redis: error, could not get topic for %s: %w", roomName, err)
	}

	return topic, nil
}

func createRoom(message *Message, roomName string) error {
	conn := pool.Get()
	defer conn.Close()

	rooms := strings.Split(roomName, "/")
	parentRoom := strings.Join(rooms[:len(rooms)-1], "/")
	exists, err := redis.Bool(conn.Do("EXISTS", chatKey(parentRoom)))
	if err != nil {
		return fmt.Errorf("redis: error, could not check if parent of %s exists: %w", roomName, err)
	}
	if !exists {
		return fmt.Errorf("redis: error, parent room does not exists for %s: %w", roomName, err)
	}
	key, err := redis.String(conn.Do(
		"XADD", chatKey(roomName), "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text,
	))
	if err != nil {
		return fmt.Errorf("redis: error, could not save first message: %w", err)
	}
	message.Timestamp, err = strconv.ParseInt(strings.Split(key, "-")[0], 10, 64)
	if err != nil {
		return fmt.Errorf("redis: error, could not parse given timestamp from new room %s: %w", key, err)
	}
	_, err = conn.Do("ZADD", subRoomsKey(parentRoom), 1, roomName)
	if err != nil {
		return fmt.Errorf("redis: error, could not set sub room %s as child: %w", roomName, err)
	}

	return nil
}

func updateUserActivity(roomName string) (int, error) {
	conn := pool.Get()
	defer conn.Close()

	usersLen := 0
	now := time.Now().Truncate(InactiveWindowSize)
	for i := 0; i < int(InactiveUserTimeout/InactiveWindowSize); i++ {
		windowKey := now.Add(time.Duration(-i) * InactiveWindowSize).Format("15:04")
		windowLen, err := redis.Int(conn.Do("SCARD", activeUserKey(roomName, windowKey)))
		if err != nil {
			return 0, fmt.Errorf("redis: error, could not get active users length: %w", err)
		}
		usersLen += windowLen
	}

	rooms := strings.Split(roomName, "/")
	parentRoom := strings.Join(rooms[:len(rooms)-1], "/")

	if roomName != parentRoom {
		_, err := conn.Do("ZADD", subRoomsKey(parentRoom), usersLen, roomName)
		if err != nil {
			return 0, fmt.Errorf("redis: error, could not update subs %s score: %w", roomName, err)
		}
	}

	return usersLen, nil
}

func registerUserActivity(roomName string, message *Message) error {
	conn := pool.Get()
	defer conn.Close()

	windowKey := time.UnixMilli(message.Timestamp).Truncate(InactiveWindowSize).Format(hourMinuteTimeLayout)
	key := activeUserKey(roomName, windowKey)

	_, err := conn.Do("SADD", activeUserKey(roomName, windowKey), message.UserName)
	if err != nil {
		return fmt.Errorf("redis: error, could not add member to set %s: %w", key, err)
	}

	_, err = conn.Do("PEXPIRE", key, InactiveWindowSize.Milliseconds(), "NX")
	if err != nil {
		return fmt.Errorf("redis: error, could not set expiration on %s: %w", key, err)
	}

	return nil
}
