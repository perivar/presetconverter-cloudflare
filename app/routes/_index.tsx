// app/routes/_index.tsx

import { LoaderFunction, redirect } from "@remix-run/cloudflare";

export const loader: LoaderFunction = async () => {
  return redirect("/frontpage");
};

export default function Index() {
  // This component will never be rendered because of the redirection in the loader
  return null;
}
