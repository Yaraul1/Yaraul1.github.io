# Visual assets

The PNG icons are original Apple macOS app icons, exported from the installed system resources with `sips`:

- `profile.png`: Contacts.app — Contacts.icns
- `projects.png`: Finder.app — Finder.icns
- `terminal.png`: Terminal.app — Terminal.icns
- `contact.png`: Mail.app — ApplicationIcon.icns
- `readme.png`: Notes.app — AppIcon.icns

`wallpapers/mac-purple.jpg` is Apple's Mac Purple wallpaper, converted from `/System/Library/Desktop Pictures/Mac Purple.heic`.

These Apple assets are separate from the MIT-licensed application source. Apple retains rights to its artwork and trademarks.

## MacBook scene

`models/macbook.glb` is the MacBook model from the pmndrs floating-laptop example:
https://github.com/pmndrs/examples/tree/main/examples/floating-laptop

The scene reuses the example’s model hierarchy. The pmndrs examples source is MIT licensed.
`draco/` contains Google's Draco decoder distributed with Three.js (Apache-2.0).
The desk, coffee cup, notebook, plant, lighting and wood texture are implemented locally in `src/components/DeskScene.tsx`.
