// app/routes/action.set-locale.ts

import { localeCookie } from "~/middleware/i18next";
import { data, type ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const newLocale = formData.get("locale");

  // Set the new locale in the cookie
  return data(
    { success: true },
    {
      headers: {
        "Set-Cookie": await localeCookie.serialize(newLocale),
      },
    }
  );
}
