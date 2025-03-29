// This used to be a file reader method, but since this will be hosted on cloudflare,
// which does not use "fs" or "path", this has been converted to reading
// a url using fetch instead

// Example:
// export async function loader({ request }: LoaderFunctionArgs) {
// Get the host from the request headers
// const host = request.headers.get("host");

// Determine the protocol
// const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

// Construct the URL using the protocol and host
// const apiUrl = `${protocol}://${host}/assets/chords/guitar.json`;

// const chordsData = (await readDataFileFromUrl(apiUrl)) as GuitarChords;
export async function readDataFileFromUrl(dataFileUrl: string) {
  console.log(`Trying to fetch data from ${dataFileUrl} ...`);

  try {
    const response = await fetch(dataFileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched data from ${dataFileUrl}`);

    return data;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      return { error: e.message };
    } else {
      throw e;
    }
  }
}
