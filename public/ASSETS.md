# Visual assets

The PNG icons are original Apple macOS app icons, exported from the installed system resources with `sips`:

- `profile.png`: Contacts.app — Contacts.icns
- `projects.png`: Finder.app — Finder.icns
- `terminal.png`: Terminal.app — Terminal.icns
- `contact.png`: Mail.app — ApplicationIcon.icns
- `readme.png`: Notes.app — AppIcon.icns

`wallpapers/mac-purple.jpg` is Apple's Mac Purple wallpaper, converted from `/System/Library/Desktop Pictures/Mac Purple.heic`.

The active wallpaper, `wallpapers/macos-27-golden-gate.jpg`, is Apple's macOS 27 Golden Gate default light wallpaper, resized from the 6K download at https://basicappleguy.com/haberdashery/macosgoldengate (https://basicappleguy.com/s/GoldenGate_6k.png).

These Apple assets are separate from the MIT-licensed application source. Apple retains rights to its artwork and trademarks.

## MacBook scene

`models/macbook.glb` is the MacBook model from the pmndrs floating-laptop example:
https://github.com/pmndrs/examples/tree/main/examples/floating-laptop

The scene reuses the example’s model hierarchy. The pmndrs examples source is MIT licensed.
`draco/` contains Google's Draco decoder distributed with Three.js (Apache-2.0).
The desk, coffee cup, notebook and plant are implemented locally in `src/components/DeskScene.tsx`. Laptop keyboard legends, speaker perforations, ports and hinges are added in `src/components/scene/WorkspaceDetails.tsx`. The screen uses a local HTML preview rather than an embedded page.

## Landing scene update (light/dark desk)

- `textures/oak-veneer-color.jpg`, `oak-veneer-normal.jpg`, `oak-veneer-roughness.jpg`: Poly Haven **Oak Veneer 01** by Jenelle van Heerden, https://polyhaven.com/a/oak_veneer_01 — CC0 (https://polyhaven.com/license). Diffuse is the 2K JPG, re-graded locally to a lighter, less saturated natural oak (gamma 0.72, saturation ×0.8); normal (OpenGL) and roughness are the 1K JPGs. About 1 MB in total.
- The cappuccino cup and saucer and the notebook with elastic band, ribbon and pen are procedural three.js geometry in `src/components/scene/WorkspaceDetails.tsx`; the two monitors (aluminium body, stand, canvas-drawn screens) are in `src/components/scene/Monitors.tsx`. No external models were added.
