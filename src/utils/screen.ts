interface FsDocumentElement extends HTMLElement {
  webkitRequestFullscreen?: () => void;
}

interface FsDocument extends Document {
  webkitIsFullScreen?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
}

/** Ask the browser for full screen. Resolves to false when it is refused or unsupported. */
export const enterFullScreen = async (): Promise<boolean> => {
  if (isFullScreen()) return true;
  const element = document.documentElement as FsDocumentElement;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen({ navigationUI: "hide" });
      return true;
    }
    if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
      return true;
    }
  } catch {
    /* refused (no user gesture, iframe policy, iOS) — the window still fills the page */
  }
  return false;
};

export const exitFullScreen = (): void => {
  if (!isFullScreen()) return;
  const fsDoc = document as FsDocument;
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else fsDoc.webkitExitFullscreen?.();
};

export const isFullScreen = (): boolean => {
  const fsDoc = document as FsDocument;
  return !!(
    fsDoc.fullscreenElement ||
    fsDoc.webkitFullscreenElement ||
    fsDoc.webkitIsFullScreen
  );
};
