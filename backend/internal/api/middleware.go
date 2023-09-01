package api

import (
	"copuchat/internal/redis"
	"log"
	"time"

	"github.com/labstack/echo/v5"
	cache "github.com/victorspringer/http-cache"
)

var cacheClient *cache.Client
var cacheResponse echo.MiddlewareFunc

func init() {
	var err error
	cacheClient, err = cache.NewClient(cache.ClientWithAdapter(redis.NewAdapter()), cache.ClientWithTTL(1*time.Hour))
	if err != nil {
		log.Fatalf("middleware: error creating cache client: %s", err)
	}
	cacheResponse = echo.WrapMiddleware(cacheClient.Middleware)
}

// TODO: check if userName is available with some generated token or something
func authUserName() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			//userName := c.QueryParam("userName")

			return next(c)
		}
	}
}
