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
	DefaultURL  = "localhost:6379"
	idleTimeout = 5 * time.Minute
	maxIdle     = 10
)

var (
	RoomMaxMessages     = 200
	InactiveUserTimeout = 1 * time.Hour
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

func chatKey(roomName string) string       { return "chat:" + roomName }
func topicKey(roomName string) string      { return "roomTopic:" + roomName }
func activeUserKey(roomName string) string { return "chatters:" + roomName }

func GetRoom(roomName string) (*Room, error) {
	topic, err := getRoomTopic(roomName)
	if err != nil && !errors.Is(err, redis.ErrNil) {
		return nil, err
	}
	activeLength, err := LenActiveUsers(roomName)
	if err != nil {
		return nil, err
	}
	conn := pool.Get()
	defer conn.Close()

	values, err := redis.Values(conn.Do("XREVRANGE", chatKey(roomName), "+", "-", "COUNT", RoomMaxMessages))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get messages for %s: %w", roomName, err)
	}

	room := &Room{
		Name:              roomName,
		Topic:             topic,
		ActiveUsersLength: activeLength,
		Messages:          make([]Message, len(values)),
	}
	for i, entryAny := range values {
		entry, _ := entryAny.([]any)
		key, _ := entry[0].([]byte)
		timestamp, err := strconv.ParseInt(strings.Split(string(key), "-")[0], 10, 64)
		if err != nil {
			return nil, fmt.Errorf("redis: error, could not parse timestamp %s: %w", key, err)
		}
		sm, _ := redis.StringMap(entry[1], nil)
		room.Messages[len(values)-1-i] = Message{sm["user"], sm["text"], timestamp}
	}

	return room, nil
}

func GetAndUpdateActiveUsers(roomName string) ([]string, error) {
	conn := pool.Get()
	defer conn.Close()

	values, err := redis.Strings(conn.Do("HGETALL", activeUserKey(roomName)))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get user activity. %w", err)
	}
	if len(values) == 0 {
		return nil, nil
	}
	userNames, deleteArgs := make([]string, len(values)/2), make([]any, len(values)/2+1)
	deleteArgs[0] = activeUserKey(roomName)
	userNamesLen, deleteArgsLen := 0, 1
	for i := 0; i < len(values)/2; i++ {
		userName, stamp := values[i*2], values[i*2+1]
		milli, err := strconv.ParseInt(stamp, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("redis: error, could not parse timestamp. %w", err)
		}
		if time.Since(time.UnixMilli(milli)) > InactiveUserTimeout {
			deleteArgs[deleteArgsLen] = userName // index out of range [2] with length 2 goroutine 23 [running]:
			deleteArgsLen++
		} else {
			userNames[userNamesLen] = userName
			userNamesLen++
		}
	}
	if deleteArgsLen > 1 {
		if _, err := conn.Do("HDEL", deleteArgs[:deleteArgsLen]...); err != nil {
			return nil, fmt.Errorf("redis: error, could not delete inactive users. %w", err)
		}
	}

	return userNames[:userNamesLen], nil
}

func LenActiveUsers(roomName string) (int, error) {
	conn := pool.Get()
	defer conn.Close()

	length, err := redis.Int(conn.Do("HLEN", activeUserKey(roomName)))
	if err != nil && !errors.Is(err, redis.ErrNil) {
		return 0, fmt.Errorf("redis: error, could not count user activity. %w", err)
	}

	return length, nil
}

func AddMessage(message *Message, roomName string) (bool, error) {
	conn := pool.Get()
	defer conn.Close()

	key, err := redis.String(conn.Do(
		"XADD", chatKey(roomName), "NOMKSTREAM", "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text,
	))
	newRoom := errors.Is(err, redis.ErrNil)
	if err != nil && !newRoom {
		return false, fmt.Errorf("redis: error, could not save message. %w", err)
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
	_, err = conn.Do("HSET", activeUserKey(roomName), message.UserName, message.Timestamp)
	if err != nil {
		return false, fmt.Errorf("redis: error, could not register user activity. %w", err)
	}

	return newRoom, nil
}

func GetSubRooms(roomName string) ([]Room, error) {
	conn := pool.Get()
	defer conn.Close()

	// TODO: Do not use KEYS, use a set `subs:roomName`
	subRooms, err := redis.Strings(conn.Do("KEYS", fmt.Sprintf("%s/*", chatKey(roomName))))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get sub room keys. %w", err)
	}
	if len(subRooms) == 0 {
		return nil, nil
	}
	topicKeys := make([]any, len(subRooms))
	for i, subRoom := range subRooms {
		subRooms[i] = strings.Split(subRoom, ":")[1]
		topicKeys[i] = topicKey(subRooms[i])
	}
	topics, err := redis.Strings(conn.Do("MGET", topicKeys...))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get sub room topics. %w", err)
	}
	rooms := make([]Room, len(subRooms))
	for i := range rooms {
		var length int
		length, err = LenActiveUsers(subRooms[i])
		if err != nil {
			return nil, fmt.Errorf("redis: error, could not get sub users count. %w", err)
		}
		rooms[i] = Room{Name: subRooms[i], Topic: topics[i], ActiveUsersLength: length}
	}

	return rooms, nil
}

func SetTopic(roomName, topic string) error {
	// TODO: Check if room exists first
	conn := pool.Get()
	defer conn.Close()

	if _, err := conn.Do("SET", topicKey(roomName), topic); err != nil {
		return fmt.Errorf("redis: error, could not set topic for %s. %w", roomName, err)
	}

	return nil
}

func createRoom(message *Message, roomName string) error {
	conn := pool.Get()
	defer conn.Close()

	path := strings.Split(roomName, "/")
	parentRoom := strings.Join(path[:len(path)-1], "/")
	exists, err := redis.Bool(conn.Do("EXISTS", chatKey(parentRoom)))
	if err != nil {
		return fmt.Errorf("redis: error, could not check if parent exists. %w", err)
	}
	if !exists {
		return fmt.Errorf("redis: error, parent room does not exists for %s. %w", roomName, err)
	}
	key, err := redis.String(conn.Do(
		"XADD", chatKey(roomName), "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text,
	))
	if err != nil {
		return fmt.Errorf("redis: error, could not save first message. %w", err)
	}
	message.Timestamp, err = strconv.ParseInt(strings.Split(key, "-")[0], 10, 64)
	if err != nil {
		return fmt.Errorf("redis: error, could not parse given timestamp from new room %s: %w", key, err)
	}

	return nil
}

func getRoomTopic(roomName string) (string, error) {
	conn := pool.Get()
	defer conn.Close()

	topic, err := redis.String(conn.Do("GET", topicKey(roomName)))
	if err != nil {
		return "", fmt.Errorf("redis: error, could not get topic for %s: %w", roomName, err)
	}

	return topic, nil
}
