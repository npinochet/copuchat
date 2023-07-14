package api

import (
	"copuchat/internal/api/params"
	"copuchat/internal/redis"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
)

func GetRoutes(app *pocketbase.PocketBase) []echo.Route {
	return []echo.Route{postMessageRoute(app)}
}

func postMessageRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "/postMessage",
		Handler: func(c echo.Context) error {
			var message *params.Message
			if err := c.Bind(message); err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, err)
			}
			if err := redis.SaveMessage(message); err != nil {
				return err
			}
			//broadcastMessage()
			return c.String(http.StatusOK, "Recieved")
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
		},
	}
}
