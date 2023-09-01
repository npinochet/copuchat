package redis

import (
	"log"
	"time"

	"github.com/gomodule/redigo/redis"
	cache "github.com/victorspringer/http-cache"
)

var KeyPrefix = "httpcache:"

type Adapter struct{}

func (a *Adapter) Get(key uint64) ([]byte, bool) {
	conn := pool.Get()
	defer conn.Close()

	val, err := redis.Bytes(conn.Do("GET", KeyPrefix+cache.KeyAsString(key)))

	return val, err == nil
}

func (a *Adapter) Set(key uint64, response []byte, expiration time.Time) {
	conn := pool.Get()
	defer conn.Close()

	if _, err := conn.Do("SET", KeyPrefix+cache.KeyAsString(key), response, "PX", time.Until(expiration)); err != nil {
		log.Printf("redis: error setting cache data: %s\n", err)
	}
}

func (a *Adapter) Release(key uint64) {
	conn := pool.Get()
	defer conn.Close()

	if _, err := conn.Do("DEL", KeyPrefix+cache.KeyAsString(key)); err != nil {
		log.Printf("redis: error deleting cache data: %s\n", err)
	}
}

func NewAdapter() cache.Adapter {
	return &Adapter{}
}
