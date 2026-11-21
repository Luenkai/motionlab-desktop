# MotionLab — Live2D Movement Studio

MotionLab is an offline-first desktop workspace for testing Live2D model movement. Import a `.zip` or multi-file Cubism package, switch between half-body and full-body parameter scopes, and manipulate the assembled model locally.

This public desktop repository intentionally ships without a character model. Your files stay on your computer and are parsed in memory by the app.

## Development

Install Node.js, Rust, and the Tauri 2 platform prerequisites. Then run:

```bash
npm install
npm run tauri:dev
```

To build installers:

```bash
npm run tauri:build
```

A fully offline release also needs a locally licensed Cubism Core runtime at `public/cubismcore/live2dcubismcore.min.js`. This repository does not redistribute Live2D SDK binaries.

## Release targets

The release workflow is prepared for Windows, macOS, and Linux artifacts. Builds are unsigned until platform-specific signing credentials are configured.
