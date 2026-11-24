import { useStore } from "~/stores";
import type { Lang } from "~/i18n/lang";
import { caseRu } from "./content.ru";
import { caseEn } from "./content.en";

/*
  LegalHub case study content. Texts live in content.ru.ts and content.en.ts (same shape,
  enforced by CaseText); this file keeps what both languages share: types and the sample
  AI answer.
*/

export type Workflow = "signing" | "certification";

export interface Stage {
  title: string;
  tool: string;
  detail: string;
  icon: string;
}

export interface ArchNode {
  id: string;
  name: string;
  tech: string;
  text: string;
}

type Entry = { title: string; text: string };

export interface CaseText {
  workflowLabel: Record<Workflow, string>;
  facts: { term: string; value: string; icon: string }[];
  problem: { before: string[]; after: string[] };
  userSteps: (Entry & { icon: string })[];
  pipelines: Record<Workflow, Stage[]>;
  /** the "AI observes, code decides" diagram */
  resolver: {
    seen: { kind: string; meta: string }[];
    rules: string[];
    decided: { ok: boolean; text: string }[];
  };
  architecture: { request: ArchNode[]; data: ArchNode[]; processing: ArchNode[] };
  decisions: { title: string; summary: string; text: string; icon: string }[];
  quality: { area: string; value: string; detail: string }[];
  nextSteps: string[];
  ui: {
    sections: Record<
      "overview" | "flow" | "demo" | "inside" | "architecture" | "decisions",
      string
    >;
    sectionsNav: string;
    back: string;
    expand: string;
    collapse: string;
    expandTitle: string;
    collapseTitle: string;
    /** the project's name on the site (the product's own name is not used) */
    name: string;
    kicker: string;
    lead: string;
    tryDemo: string;
    howItWorks: string;
    chapters: Record<
      "problem" | "flow" | "demo" | "inside" | "architecture" | "decisions",
      { title: string; lead: string }
    >;
    before: string;
    after: string;
    demoNote: string;
    scenario: string;
    step: (n: number, total: number) => string;
    resolverTitle: string;
    resolverLead: string;
    seenTitle: string;
    rulesTitle: string;
    decidedTitle: string;
    rawJson: string;
    archHint: string;
    lanes: { request: string; data: string; processing: string };
    more: string;
    less: string;
    checks: string;
    nextTitle: string;
    allProjects: string;
    demo: {
      badge: string;
      steps: string[];
      hints: {
        empty: string;
        signing: string;
        certification: string;
        running: string;
        doneSigning: string;
        doneCert: string;
        error: string;
      };
      workflows: string;
      plan: string;
      controls: string;
      dropTitle: string;
      dropText: string;
      takeSample: string;
      sourcePdf: string;
      fileBase: string;
      pages: string;
      size: string;
      fileState: { error: string; done: string; busy: string };
      status: { done: string; error: string; busy: string; uploaded: string };
      action: string;
      signingNote: string;
      simulateError: string;
      simulateErrorNote: string;
      templateLabel: string;
      templateGroup: string;
      sign: string;
      certify: string;
      pickTemplate: string;
      errorDetail: string;
      liveDone: string;
      liveError: string;
      errorTitle: string;
      download: string;
      retry: string;
      restart: string;
      viewer: string;
      prevPage: string;
      nextPage: string;
      compare: string;
      before: string;
      after: string;
      emptyViewer: string;
      signingOption: string;
      certOption: string;
    };
    paper: {
      label: (page: number, stamped: boolean) => string;
      sealSeen: string;
      sealSkipped: string;
      signSeen: string;
      signChosen: string;
    };
  };
}

export const caseText: Record<Lang, CaseText> = { ru: caseRu, en: caseEn };

/** Case texts in the current interface language. */
export function useCase(): CaseText {
  return caseText[useStore((s) => s.lang)];
}

export const observation = `{
  "signature_blocks": [
    {
      "block_type": "signature_area",
      "placement_context_type": "signature_block",
      "visible_signatory_id": 7,
      "observation_confidence": "strong",
      "x": 412, "y": 868
    },
    {
      "block_type": "company_seal_area",
      "placement_context_type": "requisites",
      "observation_confidence": "medium",
      "x": 188, "y": 702
    }
  ]
}`;

/** Technologies, shown as chips under the architecture diagram (names, not translated). */
export const stack = [
  "Next.js 16",
  "React 19",
  "TanStack Query",
  "zustand",
  "shadcn/Radix",
  "Tailwind 4",
  "FastAPI",
  "SQLAlchemy 2",
  "asyncpg",
  "Alembic",
  "PostgreSQL 16",
  "MinIO",
  "Dify",
  "LibreOffice",
  "PyMuPDF",
  "pypdf",
  "reportlab",
  "img2pdf",
  "Docker Compose"
];

/** Band (25–35% from the top) that decides which section the case nav highlights. */
export const sectionObserverMargin = "-25% 0px -65% 0px";
