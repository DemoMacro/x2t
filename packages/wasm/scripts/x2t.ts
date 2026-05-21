import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(import.meta.url.replace("file:///", "")), "..");
const TEMP_DIR = resolve(ROOT, ".temp");
const UNGH_API = "https://ungh.cc/repos/cryptpad/onlyoffice-x2t-wasm/releases/latest";

interface UnghAsset {
  contentType: string;
  size: number;
  downloadUrl: string;
}

interface UnghRelease {
  id: number;
  tag: string;
  name: string;
  assets: UnghAsset[];
}

async function fetchLatestRelease(): Promise<UnghRelease> {
  const res = await fetch(UNGH_API);
  if (!res.ok) throw new Error(`Failed to fetch release info: ${res.status}`);
  const data = (await res.json()) as { release: UnghRelease };
  return data.release;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buffer);
}

async function main() {
  console.log("Fetching latest release info...");
  const release = await fetchLatestRelease();
  console.log(`Latest: ${release.name} (${release.tag})`);

  const zipAsset = release.assets.find((a) => a.contentType === "application/zip");
  if (!zipAsset) throw new Error("No zip asset found in release");

  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEMP_DIR, { recursive: true });

  const zipPath = resolve(TEMP_DIR, "x2t.zip");
  console.log(`Downloading ${zipAsset.downloadUrl}...`);
  await downloadFile(zipAsset.downloadUrl, zipPath);
  console.log(`Downloaded: ${(zipAsset.size / 1024 / 1024).toFixed(1)} MB`);

  console.log("Extracting...");
  const IS_WIN = process.platform === "win32";
  execSync(
    IS_WIN
      ? `powershell -Command "Expand-Archive -Path .temp/x2t.zip -DestinationPath .temp -Force"`
      : `unzip -o .temp/x2t.zip -d .temp`,
    {
      cwd: ROOT,
      stdio: "inherit",
    },
  );

  rmSync(zipPath, { force: true });

  console.log("Done!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
