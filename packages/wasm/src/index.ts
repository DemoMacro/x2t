// Format constants matching x2t wasm internal IDs
export const Format = {
  // Document formats
  DOCX: 65,
  DOC: 66,
  ODT: 67,
  TXT: 69,
  HTML: 70,
  RTF: 74,
  PDF: 75,
  EPUB: 77,
  // Spreadsheet formats
  XLSX: 257,
  XLS: 258,
  ODS: 259,
  CSV: 260,
  // Presentation formats
  PPTX: 129,
  PPT: 130,
  ODP: 131,
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

function formatToExt(format: Format): string {
  const extMap: Record<number, string> = {
    65: "docx",
    66: "doc",
    67: "odt",
    69: "txt",
    70: "html",
    74: "rtf",
    75: "pdf",
    77: "epub",
    257: "xlsx",
    258: "xls",
    259: "ods",
    260: "csv",
    129: "pptx",
    130: "ppt",
    131: "odp",
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
