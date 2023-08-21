package api

import (
	"copuchat/internal/redis"
	"copuchat/internal/ws"
	"io"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
)

func Routes(app *pocketbase.PocketBase) []echo.Route {
	return []echo.Route{
		wsRoomRoute(app),
		postRoomTopicRoute(app),
		getRoomActiveUsersRoute(app),
		getSubRoomsRoute(app),
	}
}

func wsRoomRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "/ws/*",
		Handler: func(c echo.Context) error {
			userName := c.QueryParam("userName") // TODO: or is authenticated.
			if userName == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "missing userName")
			}
			roomName := c.PathParam("*")
			handler, err := ws.Handler(roomName, userName)
			if err != nil {
				return err
			}
			handler.ServeHTTP(c.Response(), c.Request())

			return nil
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
			authUserName(),
		},
	}
}

func postRoomTopicRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodPost,
		Path:   "/topic/*",
		Handler: func(c echo.Context) error {
			roomName := c.PathParam("*")
			newTopicBytes, err := io.ReadAll(c.Request().Body)
			if err != nil {
				return err
			}
			newTopic := string(newTopicBytes)
			if newTopic == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "missing topic")
			}
			if err := redis.SetTopic(roomName, newTopic); err != nil {
				return err
			}

			return c.String(http.StatusOK, "OK")
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
		},
	}
}

func getRoomActiveUsersRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "/users/*",
		Handler: func(c echo.Context) error {
			roomName := c.PathParam("*")
			userNames, err := redis.GetAndUpdateActiveUsers(roomName)
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, userNames)
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
		},
	}
}

func getSubRoomsRoute(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "/sub_rooms/*",
		Handler: func(c echo.Context) error {
			roomName := c.PathParam("*")
			rooms, err := redis.GetSubRooms(roomName)
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, rooms)
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
		},
	}
}
