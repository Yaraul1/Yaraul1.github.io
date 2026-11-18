import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Interactive demos of the projects, by case id: each one redraws the real app's interface
 * with made-up data and a simulated server. Loaded only when a case is opened.
 */
export const demos: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  spider: lazy(() => import("./SpiderDemo")),
  filter: lazy(() => import("./FilterDemo")),
  translator: lazy(() => import("./TranslatorDemo")),
  transcriber: lazy(() => import("./TranscriberDemo"))
};
