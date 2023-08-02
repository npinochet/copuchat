package redis

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
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
func titleKey(roomName string) string      { return "roomTitle:" + roomName }
func activeUserKey(roomName string) string { return "chatters:" + roomName }

func GetRoom(roomName string) (*Room, error) {
	title, err := getRoomTitle(roomName)
	if err != nil {
		return nil, err
	}
	conn := pool.Get()
	defer conn.Close()

	values, err := redis.Values(conn.Do("XREVRANGE", chatKey(roomName), "+", "-", "COUNT", RoomMaxMessages))
	if err != nil {
		return nil, fmt.Errorf("redis: error, could not get messages for %s: %w", roomName, err)
	}

	room := &Room{Name: roomName, Title: title, Messages: make([]Message, len(values))}
	for i, entryAny := range values {
		entry, _ := entryAny.([]any)
		sm, _ := redis.StringMap(entry[1], nil)
		room.Messages[i] = Message{sm["user"], sm["text"], time.Now().UnixMilli()}
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

	res, err := conn.Do(
		"XADD", chatKey(roomName), "NOMKSTREAM", "MAXLEN", "~", RoomMaxMessages, "*", "user", message.UserName, "text", message.Text,
	)
	if err != nil {
		return fmt.Errorf("redis: error, could not save message. %w", err)
	}
	if res == nil {
		// TODO: Only if parent room exists, if not send error.
		if err := createRoom(message, roomName); err != nil {
			return err
		}
	}
	_, err = conn.Do("HSET", activeUserKey(roomName), message.UserName, time.Now().UnixMilli())
	if err != nil {
		return fmt.Errorf("redis: error, could not register user activity. %w", err)
	}

	return nil
}

func AddRoom(roomName, title, userName string) error {
	if title, _ := getRoomTitle(roomName); title != "" {
		return errors.New("room already exists")
	}
	conn := pool.Get()
	defer conn.Close()

	message := &Message{
		UserName: userName,
		Text:     "Created Room " + title + "!",
	}
	if err := AddMessage(message, roomName); err != nil {
		return err
	}
	if _, err := conn.Do("SET", titleKey(roomName), title); err != nil {
		return fmt.Errorf("redis: error, could not set title for %s. %w", roomName, err)
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
	if _, err := conn.Do("SET", titleKey(roomName), message.Text); err != nil {
		return fmt.Errorf("redis: error, could not set title for %s. %w", roomName, err)
	}

	return nil
}

func getRoomTitle(roomName string) (string, error) {
	conn := pool.Get()
	defer conn.Close()

	title, err := redis.String(conn.Do("GET", titleKey(roomName)))
	if err != nil {
		return "", fmt.Errorf("redis: error, could not get title for %s: %w", roomName, err)
	}

	return title, nil
}
