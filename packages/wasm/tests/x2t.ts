import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

import { X2tConverter, Format, formatToExt } from "../src/index";

const ROOT = resolve(__dirname, "..");
const X2T_JS_PATH = resolve(ROOT, ".temp/x2t.js");
const TEMP_DIR = resolve(ROOT, ".temp");

type StageResult = { name: string; value: Format; data: Uint8Array };

async function main() {
  console.log("Initializing x2t converter...");
  console.log("x2t.js path:", X2T_JS_PATH);

  const converter = await X2tConverter.init({
    x2tJsPath: X2T_JS_PATH,
  });

  console.log("Converter initialized successfully.\n");

  const txtContent = Buffer.from("Hello, x2t wasm converter test!", "utf-8");
  const outputDir = resolve(TEMP_DIR, "output");
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  // Stage 1: TXT → all formats
  console.log("=== Stage 1: TXT → all formats ===\n");

  const stage1: StageResult[] = [];

  for (const [name, value] of Object.entries(Format)) {
    const ext = formatToExt(value as Format);
    process.stdout.write(`  TXT → ${name}: `);

    try {
      const { output } = converter.convert({
        input: txtContent,
        inputFormat: Format.TXT,
        outputFormat: value as Format,
      });

      writeFileSync(join(outputDir, `txt→${ext}.${ext}`), output);
      console.log(`OK (${output.length} bytes)`);
      stage1.push({ name, value: value as Format, data: output });
    } catch {
      console.log("FAIL");
    }
  }

  console.log(`\n  Stage 1: ${stage1.length} successful conversions\n`);

  // Stage 2: each successful stage 1 output → all formats
  console.log("=== Stage 2: intermediate → all formats ===\n");

  const matrix: Record<string, string[]> = {};

  for (const { name: srcName, value: srcValue, data } of stage1) {
    const srcExt = formatToExt(srcValue);
    process.stdout.write(`  ${srcName} (${srcExt}) → `);
    const targets: string[] = [];

    for (const [dstName, dstValue] of Object.entries(Format)) {
      if (srcValue === dstValue) continue;

      const dstExt = formatToExt(dstValue as Format);

      try {
        const { output } = converter.convert({
          input: data,
          inputFormat: srcValue,
          outputFormat: dstValue as Format,
        });

        writeFileSync(join(outputDir, `${srcExt}→${dstExt}.${dstExt}`), output);
        targets.push(dstName);
      } catch {
        // skip
      }
    }

    console.log(`${targets.length} formats`);
    if (targets.length > 0) {
      matrix[srcName] = targets;
    }
  }

  converter.destroy();

  // Summary
  console.log("\n=== Conversion Matrix ===\n");

  for (const [src, targets] of Object.entries(matrix)) {
    console.log(`  ${src}:`);
    for (const t of targets) {
      console.log(`    → ${t}`);
    }
  }

  const total = Object.values(matrix).reduce((sum, t) => sum + t.length, 0);
  console.log(`\nTotal: ${Object.keys(matrix).length} sources, ${total} conversion paths`);
  console.log(`Output files written to: ${outputDir}`);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
