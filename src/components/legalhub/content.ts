import { useStore } from "~/stores";
import type { Lang } from "~/i18n/lang";
import { caseRu } from "./content.ru";
import { caseEn } from "./content.en";

/*
  LegalHub case study content. Texts live in content.ru.ts and content.en.ts (same shape,
  enforced by CaseText); this file keeps what both languages share: types, the sample
  AI answer and the real code fragments.
*/

export type Workflow = "signing" | "certification";

export interface Stage {
  title: string;
  tool: string;
  detail: string;
  icon: string;
  /** index in codeSamples, when there is a fragment for this stage */
  code?: number;
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
  /** label and explanation for each entry of codeSamples, same order */
  code: { label: string; explanation: string }[];
  ui: {
    sections: Record<
      "overview" | "flow" | "demo" | "inside" | "architecture" | "decisions" | "code",
      string
    >;
    sectionsNav: string;
    back: string;
    expand: string;
    collapse: string;
    expandTitle: string;
    collapseTitle: string;
    kicker: string;
    lead: string;
    tryDemo: string;
    howItWorks: string;
    chapters: Record<
      "problem" | "flow" | "demo" | "inside" | "architecture" | "decisions" | "code",
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
    codeTabs: string;
    allProjects: string;
    demo: {
      badge: string;
      user: string;
      userInitial: string;
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
      batch: string;
      oneFile: string;
      errorDetail: string;
      codeLink: string;
      liveDone: string;
      liveError: string;
      errorTitle: string;
      errorNote: string;
      download: string;
      retry: string;
      stop: string;
      restart: string;
      viewer: string;
      prevPage: string;
      nextPage: string;
      compare: string;
      before: string;
      after: string;
      emptyViewer: string;
      dialogTitle: string;
      dialogNote: string;
      signingOption: string;
      certOption: string;
      cancel: string;
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

export const codeSamples = [
  {
    path: "backend/src/db/repositories/doc_processing/processing_queue.py",
    language: "python",
    code: `stmt = (
    select(BatchFile, Batch, Signatory, StampTemplate, Organization)
    .join(Batch, Batch.id == BatchFile.batch_id)
    .outerjoin(Signatory, Signatory.id == Batch.signature_id)
    .outerjoin(StampTemplate, StampTemplate.id == Batch.stamp_id)
    .outerjoin(Organization, Organization.id == StampTemplate.organization_id)
    .where(BatchFile.status == FILE_STATUS_PENDING)
    .order_by(BatchFile.created_at.asc(), BatchFile.id.asc())
    .limit(limit)
    .with_for_update(of=BatchFile, skip_locked=True)
)
rows = (await session.execute(stmt)).all()
for batch_file, batch, signatory, stamp_template, organization in rows:
    batch_file.status = FILE_STATUS_PROCESSING
    batch_file.started_at = now
    batch_file.attempt += 1`
  },
  {
    path: "backend/src/workers/doc_processing/runner.py",
    language: "python",
    code: `_USER_FACING_ERROR_BY_RAW_MESSAGE = {
    "AI returned no signing targets for this document.":
        "Не найден шаблон подписи.",
}

async with db.transaction() as session:
    updated = await mark_batch_file_done(   # UPDATE ... WHERE status='processing'
        session,
        batch_file_id=task.file.id,
        result_object_key=result_object_key,
    )
    if updated:
        await finalize_completed_batches(session, batch_ids=[task.batch.id])`
  },
  {
    path: "backend/src/services/doc_processing/processing/handlers/signing/resolver.py",
    language: "python",
    code: `# An organization-only stamp is a fallback for documents that nobody
# from the catalog personally signs. As soon as a known signatory is
# identified anywhere in the document, that person's stamp is the signature.
if _document_has_named_signatory(observations):
    organization_only_targets = []
    organization_only_direct_targets = []
else:
    organization_only_targets = _collect_organization_only_targets(...)


def _unique_template(templates):
    unique_by_id = {t.stamp_template_id: t for t in templates}
    if len(unique_by_id) != 1:
        return None  # ambiguous -> skip, never guess
    return next(iter(unique_by_id.values()))`
  },
  {
    path: "backend/src/services/doc_processing/processing/handlers/signing/stamping.py",
    language: "python",
    code: `def _img_to_pdf(x_img, y_img, page_w, page_h, img_size):
    iw, ih = img_size
    return x_img * (page_w / iw), page_h - y_img * (page_h / ih)


def _build_stamp_overlay(page_w, page_h, x_pt, y_pt, stamp_bytes):
    mark = load_mark_image(stamp_bytes)  # trims blank margins, reads DPI
    sw, sh = resolve_mark_size_pt(mark, page_width_pt=page_w, page_height_pt=page_h)
    # The AI returns the centre of the stamp; keep the whole mark on the page.
    x0 = min(max(0.0, x_pt - sw / 2), max(0.0, page_w - sw))
    y0 = min(max(0.0, y_pt - sh / 2), max(0.0, page_h - sh))
    c = Canvas(packet, pagesize=(page_w, page_h))
    c.drawImage(ImageReader(BytesIO(mark_to_png_bytes(mark))), x0, y0,
                width=sw, height=sh, mask="auto",
                preserveAspectRatio=True, anchor="sw")`
  },
  {
    path: "frontend/src/features/doc-processing/hooks/use-batches.ts",
    language: "typescript",
    code: `export function useBatches(filters: BatchesListFilters = {}, options: BatchesQueryOptions = {}) {
  return useQuery({
    queryKey: docProcessingQueryKeys.batches(filters),
    queryFn: () => getBatches(filters),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
    refetchInterval: (query) => (hasActiveBatches(query.state.data) ? 3_000 : false),
  })
}

export function createBatch(payload: CreateBatchPayload) {
  const formData = new FormData()
  formData.append("body", JSON.stringify(payload.body))
  for (const file of payload.files) formData.append("files", file)
  return fetchJson<BatchCreateResponse>("/api/doc-processing/batches", {
    method: "POST",
    body: formData,
  })
}`
  }
];

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
