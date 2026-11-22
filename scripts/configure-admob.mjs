import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const appId = "ca-app-pub-7326151414179206~2412339987";
const manifestPath = resolve("android/app/src/main/AndroidManifest.xml");
const stringsPath = resolve("android/app/src/main/res/values/strings.xml");

let manifest = await readFile(manifestPath, "utf8");
const meta = `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />`;
if (manifest.includes('android:name="com.google.android.gms.ads.APPLICATION_ID"')) {
  manifest = manifest.replace(/<meta-data[^>]*android:name="com\\.google\\.android\\.gms\\.ads\\.APPLICATION_ID"[^>]*\\/>/, meta);
} else {
  manifest = manifest.replace("</application>", `    ${meta}\n    </application>`);
}
if (!manifest.includes('android:name="com.google.android.gms.ads.APPLICATION_ID"')) {
  throw new Error("Could not insert AdMob application metadata into AndroidManifest.xml");
}
await writeFile(manifestPath, manifest);

await mkdir(dirname(stringsPath), { recursive: true });
let strings = "";
try { strings = await readFile(stringsPath, "utf8"); } catch {}
const appIdString = `<string name="admob_app_id">${appId}</string>`;
if (strings.includes('name="admob_app_id"')) {
  strings = strings.replace(/<string name="admob_app_id">[^<]*<\\/string>/, appIdString);
} else if (strings.includes("</resources>")) {
  strings = strings.replace("</resources>", `    ${appIdString}\n</resources>`);
} else {
  strings = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    ${appIdString}\n</resources>\n`;
}
await writeFile(stringsPath, strings);
console.log("Configured AdMob application ID in AndroidManifest.xml and strings.xml.");
