package redis

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gomodule/redigo/redis"
)

const (
	DefaultURL  = "localhost:6379"
	idleTimeout = 5 * time.Minute
	maxIdle     = 10
)

var (
	ErrNil              = redis.ErrNil
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

func Get(key string) ([]byte, error) {
	conn := pool.Get()
	defer conn.Close()

	return redis.Bytes(conn.Do("GET", key))
}

func SetPX(key string, data []byte, expiration time.Duration) error {
	conn := pool.Get()
	defer conn.Close()

	_, err := conn.Do("SET", key, data, "PX", expiration.Milliseconds())

	return err
}
