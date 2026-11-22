import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const appId = "ca-app-pub-7326151414179206~2412339987";
const manifestPath = resolve("android/app/src/main/AndroidManifest.xml");
const stringsPath = resolve("android/app/src/main/res/values/strings.xml");

let manifest = await readFile(manifestPath, "utf8");
const metaName = 'android:name="com.google.android.gms.ads.APPLICATION_ID"';
const meta = '<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />';
if (manifest.includes(metaName)) {
  const start = manifest.lastIndexOf("<meta-data", manifest.indexOf(metaName));
  const end = manifest.indexOf(">", manifest.indexOf(metaName)) + 1;
  if (start < 0 || end <= 0) throw new Error("Could not locate existing AdMob metadata");
  manifest = manifest.slice(0, start) + meta + manifest.slice(end);
} else {
  if (!manifest.includes("</application>")) throw new Error("AndroidManifest.xml has no application element");
  manifest = manifest.replace("</application>", `    ${meta}\n    </application>`);
}
await writeFile(manifestPath, manifest);

await mkdir(dirname(stringsPath), { recursive: true });
let strings = "";
try { strings = await readFile(stringsPath, "utf8"); } catch {}
const tag = '<string name="admob_app_id">';
const appIdString = `<string name="admob_app_id">${appId}</string>`;
if (strings.includes(tag)) {
  const start = strings.indexOf(tag);
  const end = strings.indexOf("</string>", start) + "</string>".length;
  if (end < "</string>".length) throw new Error("Could not locate existing AdMob app ID string");
  strings = strings.slice(0, start) + appIdString + strings.slice(end);
} else if (strings.includes("</resources>")) {
  strings = strings.replace("</resources>", `    ${appIdString}\n</resources>`);
} else {
  strings = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    ${appIdString}\n</resources>\n`;
}
await writeFile(stringsPath, strings);
console.log("Configured AdMob application ID in AndroidManifest.xml and strings.xml.");
