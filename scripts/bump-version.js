import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current app.config.js
const appConfigPath = path.join(__dirname, "..", "app.config.js");
const appConfigContent = fs.readFileSync(appConfigPath, "utf8");

// Extract current version
const versionMatch = appConfigContent.match(/version:\s*"([^"]+)"/);
if (!versionMatch) {
  console.error("Could not find version in app.config.js");
  process.exit(1);
}

const currentVersion = versionMatch[1];
const buildType = process.argv[2]; // 'dev' or 'production'

if (!buildType || !["dev", "production"].includes(buildType)) {
  console.error("Usage: node bump-version.js <dev|production>");
  process.exit(1);
}

let newVersion;

if (buildType === "dev") {
  // For dev: 1.0.01 => 1.0.02 (increment patch with leading zero)
  const parts = currentVersion.split(".");
  if (parts.length >= 3) {
    const patch = parseInt(parts[2]);
    const newPatch = patch + 1;
    // Format with leading zero if less than 10
    const formattedPatch = newPatch < 10 ? `0${newPatch}` : `${newPatch}`;
    newVersion = `${parts[0]}.${parts[1]}.${formattedPatch}`;
  } else {
    console.error("Invalid version format for dev bump");
    process.exit(1);
  }
} else if (buildType === "production") {
  // For production: 1.9.XY => 1.10.0 (increment minor, reset patch to 0)
  const parts = currentVersion.split(".");
  if (parts.length >= 2) {
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const newMinor = minor + 1;
    newVersion = `${major}.${newMinor}.0`;
  } else {
    console.error("Invalid version format for production bump");
    process.exit(1);
  }
}

// Update the app.config.js file
const updatedContent = appConfigContent.replace(
  /version:\s*"[^"]+"/,
  `version: "${newVersion}"`
);

fs.writeFileSync(appConfigPath, updatedContent);

console.log(
  `Version bumped from ${currentVersion} to ${newVersion} (${buildType})`
);

// Output the new version for use in GitHub Actions
console.log(`::set-output name=new_version::${newVersion}`);
