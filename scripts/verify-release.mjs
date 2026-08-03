import {
  readFile,
  readdir,
  stat
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const expectedTag =
  process.argv[2] ?? null;

function fail(message) {
  console.error(
    `Release verification failed: ${message}`
  );

  process.exit(1);
}

async function readJson(
  relativePath
) {
  const absolutePath =
    path.join(root, relativePath);

  try {
    const content =
      await readFile(
        absolutePath,
        "utf8"
      );

    return JSON.parse(content);
  } catch (error) {
    fail(
      `Unable to read ${relativePath}: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }
}

async function requirePath(
  relativePath,
  expectedType
) {
  const absolutePath =
    path.join(root, relativePath);

  try {
    const details =
      await stat(absolutePath);

    const typeMatches =
      expectedType === "directory"
        ? details.isDirectory()
        : details.isFile();

    if (!typeMatches) {
      fail(
        `${relativePath} is not a valid ${expectedType}.`
      );
    }
  } catch {
    fail(
      `Required ${expectedType} is missing: ${relativePath}`
    );
  }
}

async function listFiles(
  directory,
  prefix = ""
) {
  const entries =
    await readdir(
      directory,
      {
        withFileTypes: true
      }
    );

  const files = [];

  for (const entry of entries) {
    const relativePath =
      prefix
        ? `${prefix}/${entry.name}`
        : entry.name;

    const absolutePath =
      path.join(
        directory,
        entry.name
      );

    if (entry.isDirectory()) {
      files.push(
        ...await listFiles(
          absolutePath,
          relativePath
        )
      );
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

const packageJson =
  await readJson("package.json");

const packageLock =
  await readJson(
    "package-lock.json"
  );

const sourceManifest =
  await readJson("manifest.json");

const builtManifest =
  await readJson(
    "dist-extension/manifest.json"
  );

const version =
  packageJson.version;

if (
  typeof version !== "string" ||
  !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(
    version
  )
) {
  fail(
    `package.json contains an invalid release version: ${String(
      version
    )}`
  );
}

if (
  packageLock.version !==
    version ||
  packageLock.packages?.[""]
    ?.version !==
    version
) {
  fail(
    `package-lock.json versions do not match package.json version ${version}.`
  );
}

if (
  sourceManifest.version !==
  version
) {
  fail(
    `manifest.json version ${sourceManifest.version} does not match package.json version ${version}.`
  );
}

if (
  builtManifest.version !==
  version
) {
  fail(
    `dist-extension/manifest.json version ${builtManifest.version} does not match package.json version ${version}.`
  );
}

if (
  sourceManifest.manifest_version !==
    3 ||
  builtManifest.manifest_version !==
    3
) {
  fail(
    "The source and built extension must use Manifest V3."
  );
}

if (
  expectedTag !== null &&
  expectedTag !== `v${version}`
) {
  fail(
    `Tag ${expectedTag} does not match version v${version}.`
  );
}

const requiredFiles = [
  "dist-extension/manifest.json",
  "dist-extension/popup.html",
  "dist-extension/options.html",
  "dist-extension/background.js",
  "dist-extension/icon.png"
];

for (
  const requiredFile of
  requiredFiles
) {
  await requirePath(
    requiredFile,
    "file"
  );
}

await requirePath(
  "dist-extension/assets",
  "directory"
);

const packagedFiles =
  await listFiles(
    path.join(
      root,
      "dist-extension"
    )
  );

const forbiddenFiles =
  packagedFiles.filter(
    (file) =>
      file.endsWith(".map") ||
      file.endsWith(".ts") ||
      file.endsWith(".tsx") ||
      file.startsWith("src/") ||
      file.startsWith("node_modules/") ||
      file === "package.json" ||
      file === "package-lock.json"
  );

if (forbiddenFiles.length > 0) {
  fail(
    `Development files were found in dist-extension: ${forbiddenFiles.join(
      ", "
    )}`
  );
}

console.log(
  `Release verification passed for SipTime v${version}.`
);

console.log(
  `Verified ${packagedFiles.length} packaged files in dist-extension.`
);
