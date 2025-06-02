import * as fs from "fs";
import * as path from "path";

const xmlPath = path.join(
  process.cwd(),
  "app/utils/preset/UADSSLChannelParametersMap.xml"
);

console.log(
  `[UADSSLChannelParametersMapRawMock] Trying to load XML file at: ${xmlPath}`
);

let xmlContent: string;

if (fs.existsSync(xmlPath)) {
  xmlContent = fs.readFileSync(xmlPath, "utf-8");
  console.log("[UADSSLChannelParametersMapRawMock] File loaded successfully.");
} else {
  xmlContent = "<!-- XML file not found -->";
  console.log("[UADSSLChannelParametersMapRawMock] File not found!");
}

export default xmlContent;
