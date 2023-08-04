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
	RoomMaxMessages       = 200
	InactiveMemberTimeout = 1 * time.Hour
	TestOnBorrowTimeout   = 1 * time.Minute
	pool                  *redis.Pool
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
	conn := pool.Get()
	defer conn.Close()

	values, err := redis.Values(conn.Do("XREVRANGE", chatKey(roomName), "+", "-", "COUNT", RoomMaxMessages))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get messages for %s: %w", roomName, err)
	}

	room := &Room{Name: roomName, Topic: topic, Messages: make([]Message, len(values))}
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

func GetActiveMembers(roomName string) ([]string, error) {
	conn := pool.Get()
	defer conn.Close()

	values, err := redis.Strings(conn.Do("HGETALL", activeUserKey(roomName)))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get user activity. %w", err)
	}
	if len(values) == 0 {
		return nil, nil
	}
	userNames, deleteArgs := make([]string, len(values)/2), make([]any, len(values)/2)
	deleteArgs[0] = activeUserKey(roomName)
	userNamesLen, deleteArgsLen := 0, 1
	for i := 0; i < len(values)/2; i++ {
		userName, stamp := values[i*2], values[i*2+1]
		milli, err := strconv.ParseInt(stamp, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("redis: error, could not parse timestamp. %w", err)
		}
		if time.Since(time.UnixMilli(milli)) > InactiveMemberTimeout {
			deleteArgs[deleteArgsLen] = userName
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

func LenActiveMembers(roomName string) (int, error) {
	conn := pool.Get()
	defer conn.Close()

	length, err := redis.Int(conn.Do("HLEN", activeUserKey(roomName)))
	if err != nil {
		return 0, fmt.Errorf("redis: error, could not count user activity. %w", err)
	}

	return length, nil
}

func AddMessage(message *Message, roomName string) error {
	conn := pool.Get()
	defer conn.Close()

	key, err := redis.String(conn.Do(
		"XADD", chatKey(roomName), "NOMKSTREAM", "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text,
	))
	newRoom := errors.Is(err, redis.ErrNil)
	if err != nil && !newRoom {
		return fmt.Errorf("redis: error, could not save message. %w", err)
	}
	message.Timestamp, err = strconv.ParseInt(strings.Split(key, "-")[0], 10, 64)
	if err != nil {
		return fmt.Errorf("redis: error, could not parse given timestamp %s: %w", key, err)
	}
	if newRoom {
		// TODO: Only if parent room exists, if not send error.
		if err := createRoom(message, roomName); err != nil {
			return err
		}
	}
	_, err = conn.Do("HSET", activeUserKey(roomName), message.UserName, message.Timestamp)
	if err != nil {
		return fmt.Errorf("redis: error, could not register user activity. %w", err)
	}

	return nil
}

func AddRoom(roomName, topic, userName string) error {
	if topic, _ := getRoomTopic(roomName); topic != "" {
		return errors.New("room already exists")
	}
	conn := pool.Get()
	defer conn.Close()

	message := &Message{
		UserName: userName,
		Text:     "Created Room " + topic + "!",
	}
	if err := AddMessage(message, roomName); err != nil {
		return err
	}
	if _, err := conn.Do("SET", topicKey(roomName), topic); err != nil {
		return fmt.Errorf("redis: error, could not set topic for %s. %w", roomName, err)
	}

	return nil
}

func SetTopic(roomName, topic string) error {
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

	_, err := conn.Do("XADD", chatKey(roomName), "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text)
	if err != nil {
		return fmt.Errorf("redis: error, could not save first message. %w", err)
	}
	// TODO: Maybe broadcast "new room" on parent

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
