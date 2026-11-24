import type { ArchNode } from "./parts";

/** The illustration drawn for a project (list card and case hero), see CaseArt. */
export type ArtKind = "spider" | "filter" | "translator" | "transcriber" | "bonadi";

export interface CaseStage {
  title: string;
  /** technology used at this stage, shown as a code chip */
  tool: string;
  detail: string;
  icon: string;
}

/** Everything a case says, in one language. */
export interface CaseText {
  title: string;
  kicker: string;
  lead: string;
  facts: { term: string; value: string; icon: string }[];
  /** "before → after"; a case without a problem to solve leaves it out */
  problem?: { before: string[]; after: string[] };
  /** the user's path; left out when there is nothing to walk through */
  steps?: { title: string; text: string; icon: string }[];
  stages: CaseStage[];
  architecture: { request: ArchNode[]; data: ArchNode[]; processing: ArchNode[] };
  decisions: { title: string; summary: string; text: string; icon: string }[];
  numbers: { area: string; value: string; detail: string }[];
}

export interface ProjectCaseData {
  id: string;
  art: ArtKind;
  stack: string[];
  /** architecture block selected first */
  firstNode: string;
  /** shows the shared chapter about how two projects work together (see bridge.ts) */
  bridge?: boolean;
  /** a live site to visit instead of a demo: shown as a browser-window link */
  site?: string;
  ru: CaseText;
  en: CaseText;
}
