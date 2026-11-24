# Document signing portfolio demo

All PDF contents, organization names and stamps here are fictional. These files are presentation assets, not signed legal documents. They were created with `scripts/generate-legalhub-demo.py`.

- `source.pdf`: two-page fictional input document.
- `signing.pdf`: the same document with a demonstration signature and round seal on page 2.
- `certification.pdf`: the same document with a demonstration «Копия верна» stamp on both pages.

The pages repeat the contract rendered in `src/components/legalhub/Paper.tsx`, so the download matches the on-screen result.

The browser preview is rendered in HTML. The downloadable PDFs are pre-generated assets; the portfolio does not run the real worker, send files to Dify or access the project's databases.

## Implementation reference

The case study was prepared from these existing local projects:

- `dock_sign/Doc_Sign_Front_2`: `src/features/doc-processing/ui/new-processing-upload-screen.tsx`, `model/workflow.ts`, `api/batches.ts`, `hooks/use-batches.ts`, `src/app/api/doc-processing/batches/route.ts`.
- `dock_sign/Doc_SIgn_Back`: `src/services/doc_processing/processing/orchestrator.py`, `handlers/signing/handler.py`, `handlers/certification.py`, `src/workers/doc_processing/runner.py`, `scheduler.py`.

The “Код” section shows selected excerpts, omitting imports and surrounding logic. The design is adapted to the portfolio's window. Original applications were only read and were not modified. No production documents, connection settings or credentials are included.
