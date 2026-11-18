export interface AppsData {
  id: string;
  desktop: boolean;
  img: string;
  show?: boolean;
  dock?: boolean;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  /** the app draws its own toolbar with the window buttons in it (macOS 26 Safari style),
   *  so the window has no separate title bar */
  toolbar?: boolean;
  x?: number;
  y?: number;
  content?: JSX.Element;
  link?: string;
}
