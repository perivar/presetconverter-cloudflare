import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("./routes/_index.tsx"),
  route("/frontpage", "./routes/frontpage.tsx"),
  route("/help", "./routes/help.tsx"),
  route("/settings", "./routes/settings._index.tsx"),
  route("/action/set-locale", "./routes/action.set-locale.ts"),
  route("/action/set-theme", "./routes/action.set-theme.ts"),
  route("api/locales/:lng/:ns", "./routes/locales.ts"),
  route("*", "./routes/not-found.tsx"),
] satisfies RouteConfig;
