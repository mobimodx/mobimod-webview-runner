// Reads src/app-config.json (fetched from the backend) and writes the Android
// package id / app name / version into the Capacitor + Gradle project.
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync("src/app-config.json", "utf8"));
const appId = cfg.app?.packageId || "com.mobimod.app";
const appName = cfg.app?.name || "Mobimod App";
const version = cfg.app?.version || "1.0.0";
const versionCode = Number(process.env.VERSION_CODE || cfg.app?.versionCode || 1);

// 1) capacitor.config.json
const cap = JSON.parse(fs.readFileSync("capacitor.config.json", "utf8"));
cap.appId = appId;
cap.appName = appName;
fs.writeFileSync("capacitor.config.json", JSON.stringify(cap, null, 2));

// 2) android gradle (only after `cap add android`)
const gradle = "android/app/build.gradle";
if (fs.existsSync(gradle)) {
  let g = fs.readFileSync(gradle, "utf8");
  g = g.replace(/applicationId\s+"[^"]*"/, `applicationId "${appId}"`);
  g = g.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  g = g.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  fs.writeFileSync(gradle, g);
}

// 3) android app label (strings.xml)
const strings = "android/app/src/main/res/values/strings.xml";
if (fs.existsSync(strings)) {
  let s = fs.readFileSync(strings, "utf8");
  s = s.replace(/(<string name="app_name">)[^<]*(<\/string>)/, `$1${appName}$2`);
  s = s.replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, `$1${appName}$2`);
  fs.writeFileSync(strings, s);
}

console.log(`apply-config: ${appName} (${appId}) v${version} [${versionCode}]`);
