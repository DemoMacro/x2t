import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { X2tConverter, Format } from "../src/index";

const ROOT = resolve(__dirname, "..");
const X2T_JS_PATH = resolve(ROOT, ".temp/x2t.js");
const TEMP_DIR = resolve(ROOT, ".temp");

async function main() {
  console.log("Initializing x2t converter...");
  console.log("x2t.js path:", X2T_JS_PATH);

  const converter = await X2tConverter.init({
    x2tJsPath: X2T_JS_PATH,
  });

  console.log("Converter initialized successfully.");

  // Test: TXT -> DOCX
  const txtContent = Buffer.from("Hello, x2t wasm converter test!", "utf-8");
  console.log("\nConverting TXT -> DOCX...");
  console.log("Input size:", txtContent.length, "bytes");

  const output = converter.convert({
    input: txtContent,
    inputFormat: Format.TXT,
    outputFormat: Format.DOCX,
  });

  const outputPath = resolve(TEMP_DIR, "output.docx");
  writeFileSync(outputPath, output);
  console.log("Conversion succeeded!");
  console.log("Output size:", output.length, "bytes");
  console.log("Output written to:", outputPath);

  converter.destroy();
  console.log("\nAll tests passed!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
