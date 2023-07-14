import { Fragment } from "react";
import { Routes as ReactRoutes, Route } from "react-router-dom";

const ROUTES = import.meta.glob("/src/pages/**/[a-z[]*.tsx", { eager: true });

const routes = Object.keys(ROUTES).map((route) => {
  const path = route
    .replace(/\/src\/pages|index|\.tsx$/g, "")
    .replace(/\[\.{3}.+\]/, "*")
    .replace(/\[(.+)\]/, ":$1");

  return { path, component: (ROUTES[route] as any).default };
});

export const Routes = () => {
  return (
    <ReactRoutes>
      {routes.map(({ path, component: Component = Fragment }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
    </ReactRoutes>
  );
};
