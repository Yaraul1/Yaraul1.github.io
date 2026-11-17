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

## PBR textures and lighting

- `textures/oak-color.jpg`, `oak-normal.jpg`, `oak-roughness.jpg`: Poly Haven **Wood Table 001**, 1K JPG diffuse, OpenGL normal and roughness maps, https://polyhaven.com/a/wood_table_001.
- `hdri/studio-small-09.hdr`: Poly Haven **Studio Small 09**, 1K HDR environment by Sergej Majboroda, https://polyhaven.com/a/studio_small_09.

These Poly Haven assets are CC0: https://polyhaven.com/license.
