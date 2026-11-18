import bonadi from "./data/bonadi";
import filter from "./data/filter";
import spider from "./data/spider";
import transcriber from "./data/transcriber";
import translator from "./data/translator";
import type { ProjectCaseData } from "./types";

/** Case studies drawn from data, by id (LegalHub has its own component with a live demo). */
export const cases: Record<string, ProjectCaseData> = {
  spider,
  filter,
  translator,
  transcriber,
  bonadi
};
