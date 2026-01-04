// app/routes/action.set-theme.ts

import { createThemeAction } from "remix-themes";

import { themeSessionResolver } from "../theme.sessions.server";

export const action = createThemeAction(themeSessionResolver);
