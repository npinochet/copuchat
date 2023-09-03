package api

import (
	"github.com/labstack/echo/v5"
)

// TODO: check if userName is available with some generated token or something
func authUserName() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			//userName := c.QueryParam("userName")

			return next(c)
		}
	}
}
