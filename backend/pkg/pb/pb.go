package pb

import (
	"copuchat/internal/api"
	"log"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func NewApp() *pocketbase.PocketBase {
	app := pocketbase.New()

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		for _, r := range api.Routes(app) {
			_, _ = e.Router.AddRoute(r)
		}

		pbHandler := e.Router.HTTPErrorHandler
		defaultHandler := echo.DefaultHTTPErrorHandler(app.IsDebug())
		e.Router.HTTPErrorHandler = func(c echo.Context, err error) {
			if strings.Contains(c.Path(), "/api") {
				pbHandler(c, err)

				return
			}
			if app.IsDebug() {
				log.Println(err)
			}
			defaultHandler(c, err)
		}

		return nil
	})

	return app
}
