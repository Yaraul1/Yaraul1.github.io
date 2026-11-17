import React from "react";
import { createRoot } from "react-dom/client";
import Desktop from "~/pages/Desktop";
import Workspace from "~/pages/Workspace";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/index.css";
import "~/styles/portfolio.css";
const screenPreview = new URLSearchParams(window.location.search).get("desktop") === "1";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{screenPreview ? <Desktop /> : <Workspace />}</React.StrictMode>
);
