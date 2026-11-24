import React from "react";
import { createRoot } from "react-dom/client";
import Desktop from "~/pages/Desktop";
import Workspace from "~/pages/Workspace";
import { useThemeSync } from "~/hooks/useTheme";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/theme.css";
import "~/styles/index.css";
import "~/styles/portfolio.css";
import "~/styles/assistant.css";

const screenPreview = new URLSearchParams(window.location.search).get("desktop") === "1";

function App() {
  useThemeSync();
  return screenPreview ? <Desktop /> : <Workspace />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
