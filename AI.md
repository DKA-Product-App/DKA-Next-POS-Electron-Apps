# AI Project Context & Exclusion Rules - POS Application

Welcome AI Assistant! This document provides an overview of the POS (Point of Sale) project structure, its core technology stack, and critical directories/files that should be **excluded** from the context window to prevent massive token waste.

---

## 🚀 Project Overview
* **Name:** Athena POS Electron App
* **Type:** Desktop App (Electron + Next.js + React)
* **Package Manager:** Yarn / Bun (uses `yarn.lock`, runs with Bun in developer terminal)
* **Core Tech Stack:** Electron, Next.js (inside `/renderer`), TypeScript, TailwindCSS.

---

## 📂 Directory Structure Analysis
Here is the core directory structure of the POS project:
* `/.git` - Git repository metadata.
* `/.github` - GitHub Action workflows and templates.
* `/database` - Database resources (contains local SQLite or backup databases).
* `/main` - Electron main process codebase (Node.js runtime, API routing, events, preload window configs, API repositories).
* `/renderer` - Next.js renderer codebase (React frontend web interface).
  * `/app` - Next.js App router pages/views.
  * `/components` - Shared UI components.
  * `/contexts` - React context providers (state management).
  * `/helpers` - Utility helper functions.
  * `/public` - Static assets (images, icons, fonts).
  * `/styles` - Global CSS/Tailwind rules.
  * `/types` - TypeScript type definitions.
  * `/utils` - Common utility helpers.
* `/resources` - Electron build resources (app icons, installers, metadata).

---

## 🛑 Token-Wasting Exclusions (Boros Token)
To preserve the AI context window, do **NOT** load or read contents from the following directories or files. They consist of dependency code, compiled output, cache, lockfiles, or static media which are extremely token-heavy.

### 1. Large Auto-Generated & Build Directories
* **`node_modules/`** (Extremely heavy - contains all package dependency code).
* **`renderer/.next/`** (Extremely heavy - Next.js build cache and compiled server/client bundles).
* **`dist/`** or **`out/`** (Compiled Electron desktop application builds).
* **`app/`** (Compiled build folders or build outputs).

### 2. Lockfiles & Large Configs
* **`yarn.lock`** (~318 KB, 7000+ lines of raw dependency resolution text - do not read!).
* **`bun.lockb` / `bun.lock`** (Binary or long text package lock information).

### 3. Database & Runtime Files
* **`database/*.db`**, **`database/*.db-shm`**, **`database/*.db-wal`** (Binary SQLite database files - reading these will cause token overflow or decoding errors).

### 4. Static Media & Vector Graphics
* **`renderer/public/`** (Contains static images, PNGs, SVG graphics - no logic).
* **`resources/`** (Application icons, build installer graphics).

### 5. Log & Cache Files
* **`*.log`**, **`npm-debug.log*`**, **`yarn-debug.log*`** (Diagnostic log files).
* **`.tsconfig.tsbuildinfo`** (TypeScript compiler cache info).

---

## 🤖 Copy-Paste AI Exclude Rules (for .cursorignore / .gitignore / .copilotignore)
You can inject these glob patterns into your workspace ignore settings to automatically keep these files out of your context:

```ignore
# Dependency & Lock files
node_modules/
yarn.lock
bun.lock
bun.lockb

# Build & Compiled output
renderer/.next/
dist/
out/
app/
*.tsbuildinfo

# Database binary files
database/*.db
database/*.db-shm
database/*.db-wal

# Static and Asset files
renderer/public/
resources/

# Logs & IDE configs
.idea/
.vscode/
*.log
.DS_Store
```
