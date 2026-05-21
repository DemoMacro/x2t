# x2t

![GitHub](https://img.shields.io/github/license/DemoMacro/x2t)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

> TypeScript wrappers for OnlyOffice x2t WASM document format conversion.

## Packages

- **[@x2t/wasm](./packages/wasm/README.md)** - WASM-based document format converter (DOCX, XLSX, PPTX, ODT, ODS, ODP, RTF, CSV, TXT, HTML, and more)

## Quick Start

### x2t/wasm

```bash
# Install with npm
$ npm install @x2t/wasm

# Install with yarn
$ yarn add @x2t/wasm

# Install with pnpm
$ pnpm add @x2t/wasm
```

```typescript
import { X2tConverter, Format } from "@x2t/wasm";

const converter = await X2tConverter.init({
  x2tJsPath: "/path/to/x2t.js",
});

const { output } = converter.convert({
  input: Buffer.from("Hello, world!", "utf-8"),
  inputFormat: Format.TXT,
  outputFormat: Format.DOCX,
});

converter.destroy();
```

## Development

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 9.x or higher (recommended package manager)
- **Git** for version control

### Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/DemoMacro/x2t.git
   cd x2t
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Development mode**:

   ```bash
   pnpm dev
   ```

4. **Build all packages**:

   ```bash
   pnpm build
   ```

### Development Commands

```bash
pnpm dev            # Development mode with watch
pnpm build          # Build all packages
pnpm check          # Run code formatting and linting
```

## Contributing

We welcome contributions! Here's how to get started:

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/x2t.git
   cd x2t
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/DemoMacro/x2t.git
   ```

4. **Install dependencies**:

   ```bash
   pnpm install
   ```

5. **Development mode**:

   ```bash
   pnpm dev
   ```

### Development Workflow

1. **Code**: Follow our project standards
2. **Test**: `pnpm build && <test your changes>`
3. **Commit**: Use conventional commits (`feat:`, `fix:`, etc.)
4. **Push**: Push to your fork
5. **Submit**: Create a Pull Request to upstream repository

## Support & Community

- 📫 [Report Issues](https://github.com/DemoMacro/x2t/issues)
- 📚 [x2t/wasm Documentation](./packages/wasm/README.md)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
