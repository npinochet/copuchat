package pb

import (
	"copuchat/internal/api"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func NewApp() *pocketbase.PocketBase {
	app := pocketbase.New()

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		for _, r := range api.GetRoutes(app) {
			_, _ = e.Router.AddRoute(r)
		}

		return nil
	})

	return app
}
