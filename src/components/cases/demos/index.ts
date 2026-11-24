import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Interactive demos of the projects, by case id, with made-up data and a simulated server.
 * Loaded only when a case is opened.
 */
export const demos: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  // simplified schemes with made-up data, not copies of the real apps
  spider: lazy(() => import("./TenderDemo")),
  filter: lazy(() => import("./FlowDemo")),
  translator: lazy(() => import("./TranslateDemo")),
  transcriber: lazy(() => import("./TranscriberDemo"))
};
