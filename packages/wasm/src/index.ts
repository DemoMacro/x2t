// Format IDs from OfficeFileFormats.h (ONLYOFFICE/core)
export const Format = {
  // Document (0x0040)
  DOCX: 0x0041,
  DOC: 0x0042,
  ODT: 0x0043,
  RTF: 0x0044,
  TXT: 0x0045,
  HTML: 0x0046,
  MHT: 0x0047,
  EPUB: 0x0048,
  FB2: 0x0049,
  MOBI: 0x004a,
  DOCM: 0x004b,
  DOTX: 0x004c,
  DOTM: 0x004d,
  FODT: 0x004e,
  OTT: 0x004f,
  DOC_FLAT: 0x0050,
  DOCX_FLAT: 0x0051,
  HTML_IN_CONTAINER: 0x0052,
  DOCX_PACKAGE: 0x0054,
  OFORM: 0x0055,
  DOCXF: 0x0056,
  OFORM_PDF: 0x0057,
  PAGES: 0x0058, // Apple Pages
  HWP: 0x0059, // Hangul Word Processor
  HWPX: 0x005a,
  HWPML: 0x005b,
  MD: 0x005c, // Markdown
  DOCUMENT_XML: 0x0070,

  // Presentation (0x0080)
  PPTX: 0x0081,
  PPT: 0x0082,
  ODP: 0x0083,
  PPSX: 0x0084,
  PPTM: 0x0085,
  PPSM: 0x0086,
  POTX: 0x0087,
  POTM: 0x0088,
  FODP: 0x0089,
  OTP: 0x008a,
  PPTX_PACKAGE: 0x008b,
  ODG: 0x008c,
  KEY: 0x008d, // Apple Keynote

  // Spreadsheet (0x0100)
  XLSX: 0x0101,
  XLS: 0x0102,
  ODS: 0x0103,
  CSV: 0x0104,
  XLSM: 0x0105,
  XLTX: 0x0106,
  XLTM: 0x0107,
  XLSB: 0x0108,
  FODS: 0x0109,
  OTS: 0x010a,
  XLSX_FLAT: 0x010b,
  XLSX_PACKAGE: 0x010c,
  NUMBERS: 0x010d, // Apple Numbers

  // Crossplatform (0x0200)
  PDF: 0x0201,
  SWF: 0x0202,
  DJVU: 0x0203,
  XPS: 0x0204,
  SVG: 0x0205,
  HTMLR: 0x0206,
  HTMLR_MENU: 0x0207,
  HTMLR_CANVAS: 0x0208,
  PDFA: 0x0209,
  OFD: 0x020a, // Chinese Open Fixed-layout Document

  // Image (0x0400)
  JPG: 0x0401,
  TIFF: 0x0402,
  TGA: 0x0403,
  GIF: 0x0404,
  PNG: 0x0405,
  EMF: 0x0406,
  WMF: 0x0407,
  BMP: 0x0408,
  CR2: 0x0409,
  PCX: 0x040a,
  RAS: 0x040b,
  PSD: 0x040c,
  ICO: 0x040d,

  // Other (0x0800)
  EXTRACT_IMAGE: 0x0801,
  MS_OFFCRYPTO: 0x0802,
  HTMLZIP: 0x0803,
  OLD_DOCUMENT: 0x0804,
  OLD_PRESENTATION: 0x0805,
  OLD_DRAWING: 0x0806,
  OOXML: 0x0807,
  JSON: 0x0808,
  ZIP: 0x0809,
  ODF: 0x080a,
  MS_MITCRYPTO: 0x080b,
  MS_VBAPROJECT: 0x080c,
  PACKAGE_IN_OLE: 0x080d,

  // Teamlab — OnlyOffice internal binary (0x1000)
  DOCY: 0x1001,
  XLSY: 0x1002,
  PPTY: 0x1003,
  VSDY: 0x1004,

  // Canvas (0x2000)
  CANVAS_WORD: 0x2001,
  CANVAS_SPREADSHEET: 0x2002,
  CANVAS_PRESENTATION: 0x2003,
  CANVAS_PDF: 0x2004,
  CANVAS_DRAW: 0x2005,

  // Draw (0x4000)
  VSDX: 0x4001,
  VSSX: 0x4002,
  VSTX: 0x4003,
  VSDM: 0x4004,
  VSSM: 0x4005,
  VSTM: 0x4006,
} as const;
export type Format = (typeof Format)[keyof typeof Format];

export interface X2tOptions {
  /** Path (Node.js) or URL (browser) to x2t.js. x2t.wasm must be in the same directory. */
  x2tJsPath: string;
  /** Font directory path (optional, used for PDF rendering) */
  fontDir?: string;
}

export interface ConvertOptions {
  /** Input file data */
  input: Buffer | Uint8Array;
  /** Input format */
  inputFormat: Format;
  /** Output format */
  outputFormat: Format;
  /** CSV/TXT encoding code (optional) */
  csvTxtEncoding?: number;
  /** CSV delimiter code (optional) */
  csvDelimiter?: number;
}

export interface X2tModule {
  ccall: (name: string, returnType: string | null, argTypes: string[], args: unknown[]) => number;
  FS: {
    mkdirTree: (path: string) => void;
    writeFile: (path: string, data: Uint8Array | string) => void;
    readFile: (path: string) => Uint8Array;
    readdir: (path: string) => string[];
    unlink: (path: string) => void;
    rmdir: (path: string) => void;
    isDir: (mode: number) => boolean;
  };
  calledRun: boolean;
  onRuntimeInitialized?: () => void;
}

const IS_NODE = typeof process === "object" && !!process?.versions?.node;
const _g = globalThis as unknown as Record<string, unknown>;
const IS_WORKER =
  typeof _g["WorkerGlobalScope"] !== "undefined" && typeof _g["importScripts"] === "function";

const WORK_DIR = "/working";

export function formatToExt(format: Format): string {
  const extMap: Record<number, string> = {
    // Document
    0x0041: "docx",
    0x0042: "doc",
    0x0043: "odt",
    0x0044: "rtf",
    0x0045: "txt",
    0x0046: "html",
    0x0047: "mht",
    0x0048: "epub",
    0x0049: "fb2",
    0x004a: "mobi",
    0x004b: "docm",
    0x004c: "dotx",
    0x004d: "dotm",
    0x004e: "fodt",
    0x004f: "ott",
    0x0050: "doc",
    0x0051: "docx",
    0x0052: "html",
    0x0054: "docx",
    0x0055: "oform",
    0x0056: "docxf",
    0x0057: "pdf",
    0x0058: "pages",
    0x0059: "hwp",
    0x005a: "hwpx",
    0x005b: "hwpml",
    0x005c: "md",
    0x0070: "xml",
    // Presentation
    0x0081: "pptx",
    0x0082: "ppt",
    0x0083: "odp",
    0x0084: "ppsx",
    0x0085: "pptm",
    0x0086: "ppsm",
    0x0087: "potx",
    0x0088: "potm",
    0x0089: "fodp",
    0x008a: "otp",
    0x008b: "pptx",
    0x008c: "odg",
    0x008d: "key",
    // Spreadsheet
    0x0101: "xlsx",
    0x0102: "xls",
    0x0103: "ods",
    0x0104: "csv",
    0x0105: "xlsm",
    0x0106: "xltx",
    0x0107: "xltm",
    0x0108: "xlsb",
    0x0109: "fods",
    0x010a: "ots",
    0x010b: "xlsx",
    0x010c: "xlsx",
    0x010d: "numbers",
    // Crossplatform
    0x0201: "pdf",
    0x0202: "swf",
    0x0203: "djvu",
    0x0204: "xps",
    0x0205: "svg",
    0x0206: "html",
    0x0207: "html",
    0x0208: "html",
    0x0209: "pdf",
    0x020a: "ofd",
    // Image
    0x0401: "jpg",
    0x0402: "tiff",
    0x0403: "tga",
    0x0404: "gif",
    0x0405: "png",
    0x0406: "emf",
    0x0407: "wmf",
    0x0408: "bmp",
    0x0409: "cr2",
    0x040a: "pcx",
    0x040b: "ras",
    0x040c: "psd",
    0x040d: "ico",
    // Other
    0x0801: "bin",
    0x0802: "docx",
    0x0803: "zip",
    0x0804: "doc",
    0x0805: "ppt",
    0x0806: "vsd",
    0x0807: "xml",
    0x0808: "json",
    0x0809: "zip",
    0x080a: "odf",
    0x080b: "docx",
    0x080c: "bin",
    0x080d: "bin",
    // Teamlab (internal binary)
    0x1001: "bin",
    0x1002: "bin",
    0x1003: "bin",
    0x1004: "bin",
    // Canvas
    0x2001: "bin",
    0x2002: "bin",
    0x2003: "bin",
    0x2004: "bin",
    0x2005: "bin",
    // Draw
    0x4001: "vsdx",
    0x4002: "vssx",
    0x4003: "vstx",
    0x4004: "vsdm",
    0x4005: "vssm",
    0x4006: "vstm",
  };
  const ext = extMap[format];
  if (!ext) throw new Error(`Unknown format: ${format}`);
  return ext;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildXmlConfig(options: {
  inputPath: string;
  outputPath: string;
  fontDir?: string;
  csvTxtEncoding?: number;
  csvDelimiter?: number;
}): string {
  const lines: string[] = ['<?xml version="1.0" encoding="utf-8"?>', "<TaskQueueDataConvert>"];

  lines.push(`<m_sFileFrom>${escapeXml(options.inputPath)}</m_sFileFrom>`);
  lines.push(`<m_sFileTo>${escapeXml(options.outputPath)}</m_sFileTo>`);

  if (options.fontDir) {
    lines.push(`<m_sFontDir>${escapeXml(options.fontDir)}</m_sFontDir>`);
  }

  if (options.csvTxtEncoding !== undefined) {
    lines.push(`<m_nCsvTxtEncoding>${options.csvTxtEncoding}</m_nCsvTxtEncoding>`);
  }
  if (options.csvDelimiter !== undefined) {
    lines.push(`<m_nCsvDelimiter>${options.csvDelimiter}</m_nCsvDelimiter>`);
  }

  lines.push("</TaskQueueDataConvert>");

  return lines.join("\n");
}

export function cleanupDir(mod: X2tModule, dir: string): void {
  try {
    const entries = mod.FS.readdir(dir);
    for (const entry of entries) {
      if (entry === "." || entry === "..") continue;
      const fullPath = `${dir}/${entry}`;
      try {
        mod.FS.unlink(fullPath);
      } catch {
        // If it's a directory, recurse
        cleanupDir(mod, fullPath);
      }
    }
    if (dir !== WORK_DIR) {
      mod.FS.rmdir(dir);
    }
  } catch {
    // Directory may not exist, ignore
  }
}

export async function waitForReady(mod: X2tModule): Promise<void> {
  if (mod.calledRun) return;
  return new Promise<void>((resolve) => {
    mod.onRuntimeInitialized = () => resolve();
  });
}

export async function loadModuleNode(x2tJsPath: string): Promise<X2tModule> {
  // Node.js: dynamic import triggers x2t.js which does module.exports = Module
  // Use file:// URL for Windows compatibility with dynamic import
  const fileUrl = new URL("file:///" + x2tJsPath.replace(/\\/g, "/"));
  const mod = (await import(/* @vite-ignore */ fileUrl.href)) as {
    default?: X2tModule;
  } & X2tModule;
  // x2t.js sets module.exports = Module, so the import result IS the Module
  return (mod as unknown as { default?: X2tModule }).default ?? (mod as unknown as X2tModule);
}

export async function loadModuleBrowser(x2tJsPath: string): Promise<X2tModule> {
  if (IS_WORKER) {
    return loadModuleWorker(x2tJsPath);
  }
  // Browser main thread: load via <script> tag
  (globalThis as Record<string, unknown>).Module = {};

  return new Promise<X2tModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = x2tJsPath;
    script.onload = () => {
      const mod = (globalThis as Record<string, unknown>).Module as X2tModule;
      if (mod) {
        resolve(mod);
      } else {
        reject(new Error("x2t.js did not set globalThis.Module"));
      }
    };
    script.onerror = () => reject(new Error(`Failed to load x2t.js from ${x2tJsPath}`));
    document.head.appendChild(script);
  });
}

export function loadModuleWorker(x2tJsPath: string): X2tModule {
  // Worker: use importScripts, but must set __filename first
  // so x2t.js can locate x2t.wasm in the same directory
  const self = globalThis as Record<string, unknown>;
  self.__filename = x2tJsPath;
  (globalThis as unknown as { importScripts: (...args: string[]) => void }).importScripts(
    x2tJsPath,
  );
  const mod = self.Module as X2tModule;
  if (!mod) throw new Error("x2t.js did not set Module in Worker");
  return mod;
}

export class X2tConverter {
  private mod: X2tModule;
  private fontDir?: string;

  private constructor(mod: X2tModule, fontDir?: string) {
    this.mod = mod;
    this.fontDir = fontDir;
  }

  static async init(options: X2tOptions): Promise<X2tConverter> {
    const mod = IS_NODE
      ? await loadModuleNode(options.x2tJsPath)
      : await loadModuleBrowser(options.x2tJsPath); // handles both main thread and worker

    // Wait for wasm to finish loading
    await waitForReady(mod);

    return new X2tConverter(mod, options.fontDir);
  }

  convert(options: ConvertOptions): Uint8Array {
    const inputExt = formatToExt(options.inputFormat);
    const outputExt = formatToExt(options.outputFormat);
    const inputPath = `${WORK_DIR}/input.${inputExt}`;
    const outputPath = `${WORK_DIR}/output.${outputExt}`;
    const configPath = `${WORK_DIR}/config.xml`;

    try {
      // Ensure working directory exists
      this.mod.FS.mkdirTree(WORK_DIR);

      // Write input file
      this.mod.FS.writeFile(inputPath, new Uint8Array(options.input));

      // Write XML config
      const xml = buildXmlConfig({
        inputPath,
        outputPath,
        fontDir: this.fontDir,
        csvTxtEncoding: options.csvTxtEncoding,
        csvDelimiter: options.csvDelimiter,
      });
      this.mod.FS.writeFile(configPath, xml);

      // Execute conversion
      const result = this.mod.ccall("main1", "number", ["string"], [configPath]);
      if (result !== 0) {
        throw new Error(`x2t conversion failed with code: ${result}`);
      }

      // Read output
      return this.mod.FS.readFile(outputPath);
    } finally {
      cleanupDir(this.mod, WORK_DIR);
    }
  }

  destroy(): void {
    // No-op: the Module lifecycle is managed by x2t.js
  }
}
