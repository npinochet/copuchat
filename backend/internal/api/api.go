package api

import (
	"copuchat/internal/redis"
	"copuchat/internal/ws"
	"io"
	"net"
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
		//getPreviewURL(app),
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
			ws.Handler(roomName, userName).ServeHTTP(c.Response(), c.Request())

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
			userNames, err := redis.GetActiveUsers(roomName)
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
			subRooms, err := redis.GetTopSubRooms(roomName)
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, subRooms)
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
		},
	}
}

func getPreviewURL(app *pocketbase.PocketBase) echo.Route {
	return echo.Route{
		Method: http.MethodGet,
		Path:   "preview_url",
		Handler: func(c echo.Context) error {
			paramURL := c.QueryParam("url")
			if paramURL == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "missing url")
			}
			req, err := http.NewRequest(http.MethodGet, paramURL, nil)
			if err != nil {
				return err
			}
			if clientIP, _, err := net.SplitHostPort(c.Request().RemoteAddr); err == nil {
				req.Header.Set("X-Forwarded-For", clientIP)
			}

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				return err
			}
			defer resp.Body.Close()

			contentType := resp.Header.Get("Content-Type")
			if contentType == "" {
				contentType = "text/html"
			}

			return c.Stream(http.StatusOK, contentType, resp.Body)
		},
		Middlewares: []echo.MiddlewareFunc{
			apis.ActivityLogger(app),
			cacheResponse,
		},
	}
}
