import { createContext, useContext, type ReactNode } from "react";

export interface WindowControls {
  id: string;
  full: boolean;
  toggleFull: () => void;
  /** Leaves full screen and hides the window in the Dock, revealing the desktop. */
  toDesktop: () => void;
  /** Zoom like a double click on the title bar (not in full screen). */
  zoom: () => void;
  /** The window's close / minimize / full screen buttons, for an app that draws its own
   *  toolbar (the window then has no title bar). */
  lights: ReactNode;
}

export const WindowContext = createContext<WindowControls | null>(null);

/** Lets app content (a case study, the projects list) offer its own window buttons. */
export const useWindowControls = () => useContext(WindowContext);
