package api

import (
	"copuchat/internal/redis"
	"copuchat/internal/ws"
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
)

func Routes(app *pocketbase.PocketBase) []echo.Route {
	return []echo.Route{
		wsRoute(app),
		postNewRoomRoute(app),
	}
}

func wsRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "/ws/*",
		Handler: func(c echo.Context) error {
			userName := c.QueryParam("userName") // TODO: or is authenticated.
			if userName == "" {
				return echo.NewHTTPError(http.StatusBadRequest+4, errors.New("missing userName"))
			}
			roomName := c.PathParam("*")
			handler, err := ws.Handler(roomName, userName)
			if err != nil {
				return err
			}
			handler.ServeHTTP(c.Response(), c.Request())

			return c.String(http.StatusInternalServerError, "connection closed")
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
			authUserName(),
		},
	}
}

func postNewRoomRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "/new_room/*",
		Handler: func(c echo.Context) error {
			roomName, title, userName := c.PathParam("*"), c.QueryParam("title"), c.QueryParam("userName")
			if roomName == "" || title == "" {
				return echo.NewHTTPError(http.StatusBadRequest, errors.New("missing room or title"))
			}
			if err := redis.AddRoom(roomName, title, userName); err != nil {
				return err
			}
			data := &redis.Message{UserName: userName, Text: "New room Created!" + roomName}
			if err := ws.GetHub(roomName).Broadcast(data, nil); err != nil {
				return err
			}

			return c.String(http.StatusOK, "Created")
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
		},
	}
}
