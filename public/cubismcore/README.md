# Local Cubism Core runtime

For a fully offline Tauri build, place the locally licensed Live2D Cubism Core web runtime at:

`public/cubismcore/live2dcubismcore.min.js`

The motionlab runtime loader tries this bundled path first. In the browser-only website it can fall back to the official remote Core URL; the desktop build does not silently depend on the network.

Do not commit or redistribute Live2D SDK binaries unless your SDK license permits it.
