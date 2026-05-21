# @x2t/wasm

![npm version](https://img.shields.io/npm/v/@x2t/wasm)
![npm downloads](https://img.shields.io/npm/dw/@x2t/wasm)
![npm license](https://img.shields.io/npm/l/@x2t/wasm)

> TypeScript wrapper for [OnlyOffice x2t WASM](https://github.com/nicedoc/onlyoffice-x2t-wasm) document format converter.

## Features

- **Multi-format** - DOCX, DOC, ODT, RTF, TXT, HTML, XLSX, XLS, ODS, CSV, PPTX, PPT, ODP and more
- **Node.js & Browser** - Works in Node.js, browser main thread, and Web Worker
- **TypeScript-First** - Full type safety with comprehensive TypeScript support

## Installation

```bash
# Install with npm
$ npm install @x2t/wasm

# Install with yarn
$ yarn add @x2t/wasm

# Install with pnpm
$ pnpm add @x2t/wasm
```

> **Note:** This package does NOT bundle `x2t.js` and `x2t.wasm` (AGPL-3.0 licensed). You need to download them separately. See [Downloading x2t](#downloading-x2t).

## Quick Start

### Node.js

```typescript
import { X2tConverter, Format } from "@x2t/wasm";

const converter = await X2tConverter.init({
  x2tJsPath: "/path/to/x2t.js", // x2t.wasm must be in the same directory
});

const { output } = converter.convert({
  input: Buffer.from("Hello, world!", "utf-8"),
  inputFormat: Format.TXT,
  outputFormat: Format.DOCX,
});

converter.destroy();
```

### Browser

```html
<script type="module">
  import { X2tConverter, Format } from "@x2t/wasm";

  const converter = await X2tConverter.init({
    x2tJsPath: "https://example.com/x2t.js",
  });

  const { output } = converter.convert({
    input: new Uint8Array([
      /* file bytes */
    ]),
    inputFormat: Format.DOCX,
    outputFormat: Format.ODT,
  });

  converter.destroy();
</script>
```

### Web Worker

```typescript
// worker.ts
import { X2tConverter, Format } from "@x2t/wasm";

const converter = await X2tConverter.init({
  x2tJsPath: "/path/to/x2t.js",
});
```

In Worker mode, `x2t.js` is loaded via `importScripts()`.

## Downloading x2t

Use the built-in script to download the latest x2t release:

```bash
npx tsx scripts/x2t.ts
```

This downloads `x2t.js` and `x2t.wasm` to the `.temp/` directory.

Or manually from [onlyoffice-x2t-wasm releases](https://github.com/nicedoc/onlyoffice-x2t-wasm/releases).

## Important Notes

- `x2t.js` and `x2t.wasm` are licensed under **AGPL-3.0** and must be obtained separately
- `x2t.wasm` must be in the **same directory** as `x2t.js`
- The converter operates on Emscripten's virtual filesystem (MEMFS) — no real filesystem access in browser
- PDF, SVG, and image output formats require the OnlyOffice Canvas renderer (not included in the WASM build)
- For PDF conversion, consider using LibreOffice headless or the full OnlyOffice Document Server

## License

MIT © [Demo Macro](https://www.demomacro.com/)
