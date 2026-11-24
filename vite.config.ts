import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import autoImport from "unplugin-auto-import/vite";
import fs from "fs";
import path from "path";

// The CV is kept out of the repo (.gitignore): the "Download CV" button gets a link only
// when the file is there, so the published site never links to a missing file.
const RESUME = "resume/Yuferev_Yaroslav_CV.pdf";
const hasResume = fs.existsSync(path.resolve(__dirname, "public", RESUME));
// The same for the profile photo: without the file, "About me" shows the initials.
const PHOTO = "profile/photo.webp";
const hasPhoto = fs.existsSync(path.resolve(__dirname, "public", PHOTO));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    unocss(),
    react(),
    autoImport({
      imports: ["react"],
      dts: "src/auto-imports.d.ts",
      dirs: ["src/hooks", "src/stores", "src/components/**"]
    })
  ],
  define: {
    __RESUME_URL__: JSON.stringify(hasResume ? `/${RESUME}` : ""),
    __PHOTO_URL__: JSON.stringify(hasPhoto ? `/${PHOTO}` : "")
  },
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`
    }
  }
});
