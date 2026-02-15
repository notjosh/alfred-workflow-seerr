import { readFileSync, writeFileSync } from "fs";
const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/stamp-version.js <version>");
  process.exit(1);
}
const plist = readFileSync("info.plist", "utf8");
writeFileSync(
  "info.plist",
  plist.replace(
    /(<key>version<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${version}$2`,
  ),
);
