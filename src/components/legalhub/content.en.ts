import type { CaseText } from "./content";

export const caseEn: CaseText = {
  workflowLabel: { signing: "Signing", certification: "Certification" },

  facts: [
    {
      icon: "i-ph-briefcase",
      term: "What it is",
      value: "A web service for a legal department"
    },
    {
      icon: "i-ph-flow-arrow",
      term: "Workflows",
      value: "Signature with seal; “true copy” stamp"
    },
    {
      icon: "i-ph-files",
      term: "Input",
      value: "PDF, Word, Excel, scans — up to 50 files"
    },
    { icon: "i-ph-users-three", term: "Team", value: "2 developers, March — August 2026" }
  ],

  problem: {
    before: [
      "Every contract was opened and signed by hand",
      "“True copy” stamps placed page by page",
      "Easy to use the wrong seal or signatory"
    ],
    after: [
      "A whole batch is uploaded in one go",
      "The service finds the spot and the signatory",
      "Not sure? It flags an error instead of stamping"
    ]
  },

  userSteps: [
    {
      icon: "i-ph-upload-simple",
      title: "Upload",
      text: "Drop a batch of files into the window"
    },
    {
      icon: "i-ph-cursor-click",
      title: "Choose an action",
      text: "Signing, or certification with a template"
    },
    {
      icon: "i-ph-hourglass-medium",
      title: "Wait",
      text: "Statuses refresh on their own every 3 seconds"
    },
    {
      icon: "i-ph-download-simple",
      title: "Collect the PDFs",
      text: "Preview in the browser or save them all to a folder"
    }
  ],

  pipelines: {
    signing: [
      {
        icon: "i-ph-queue",
        title: "Queue",
        tool: "API → PostgreSQL",
        detail:
          "The original goes to MinIO and a file row with status pending appears in the database. A free worker picks it up.",
        code: 0
      },
      {
        icon: "i-ph-file-pdf",
        title: "To PDF",
        tool: "LibreOffice · PyMuPDF",
        detail:
          "Word and Excel become PDF through LibreOffice; pages are normalised to A4."
      },
      {
        icon: "i-ph-eye",
        title: "AI looks",
        tool: "PyMuPDF → Dify",
        detail:
          "Each page goes to Dify as a 96 DPI image, along with the directory of signatories and organisations."
      },
      {
        icon: "i-ph-funnel",
        title: "Code decides",
        tool: "resolver",
        detail:
          "Rules discard the noise and pick a stamp template only when it's unambiguous.",
        code: 2
      },
      {
        icon: "i-ph-seal-check",
        title: "Stamp",
        tool: "pypdf · reportlab · img2pdf",
        detail:
          "Signature and seal land on the found spot, kept inside the page. The result is a PDF that can't be edited.",
        code: 3
      }
    ],
    certification: [
      {
        icon: "i-ph-queue",
        title: "Queue",
        tool: "API → PostgreSQL",
        detail:
          "The original goes to MinIO and a file row with status pending appears in the database. A free worker picks it up.",
        code: 0
      },
      {
        icon: "i-ph-file-pdf",
        title: "To PDF",
        tool: "LibreOffice · Pillow",
        detail:
          "Office files go through LibreOffice, images through Pillow, PDFs stay as they are."
      },
      {
        icon: "i-ph-image",
        title: "Render",
        tool: "PyMuPDF · 150 DPI",
        detail: "No AI needed here: every page becomes a 150 DPI image."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Free space",
        tool: "integral image",
        detail:
          "A stamp-sized window moves from the bottom-right corner. The first spot with under 1.5% “ink” wins."
      },
      {
        icon: "i-ph-stamp",
        title: "Stamp",
        tool: "Pillow · img2pdf",
        detail:
          "The “true copy” template goes on every page, and the pages are assembled into a PDF.",
        code: 1
      }
    ]
  },

  resolver: {
    seen: [
      { kind: "Signature · signatory #7", meta: "signature_area · strong" },
      { kind: "Company seal", meta: "in requisites · medium" }
    ],
    rules: [
      "Signature and seal blocks only",
      "Exactly one matching template",
      "Known signatory — no stand-alone seal",
      "IDs checked against the allow-list"
    ],
    decided: [
      { ok: true, text: "Signature + seal → template “Пример Б. Б.”" },
      { ok: false, text: "Seal in requisites → skipped" }
    ]
  },

  architecture: {
    request: [
      {
        id: "browser",
        name: "Interface",
        tech: "Next.js 16 · React 19 · TanStack Query",
        text: "Upload, workflow choice, the batch list and PDF preview. While anything is in progress, statuses are polled every 3 seconds."
      },
      {
        id: "bff",
        name: "BFF",
        tech: "Next.js route handlers",
        text: "Sits between the browser and the API: streams uploads, keeps the refresh token in an HttpOnly cookie, serves PDFs in 4 MB ranges."
      },
      {
        id: "api",
        name: "API",
        tech: "FastAPI · SQLAlchemy 2 async",
        text: "Creates batches, puts files into storage, manages the directories. Sign-in via LDAP, roles admin / editor / viewer."
      }
    ],
    data: [
      {
        id: "postgres",
        name: "PostgreSQL",
        tech: "16 · Alembic",
        text: "Batches, files, organisations, signatories, templates. The files table doubles as the job queue."
      },
      {
        id: "minio",
        name: "MinIO",
        tech: "S3-compatible storage",
        text: "Originals, results and stamp images. Downloads go through signed links valid for an hour."
      }
    ],
    processing: [
      {
        id: "worker",
        name: "Worker",
        tech: "Python 3.13 · separate process",
        text: "Claims up to 25 files, processes them one by one, records the result or the error. Scales with more processes."
      },
      {
        id: "libreoffice",
        name: "LibreOffice",
        tech: "25.8, headless",
        text: "Word, Excel and PowerPoint → PDF. The version is pinned and ~330 fonts are bundled so layouts match Word."
      },
      {
        id: "dify",
        name: "Dify",
        tech: "vision workflow",
        text: "Signing only: gets a page image and the directories, returns observations as JSON."
      }
    ]
  },

  decisions: [
    {
      icon: "i-ph-database",
      title: "The queue lives in PostgreSQL",
      summary: "No Redis, no Celery",
      text: "The worker claims files with FOR UPDATE SKIP LOCKED. Completion is guarded by WHERE status = 'processing', so a late result can't overwrite a newer one. Files stuck for over 5 minutes go back to the queue."
    },
    {
      icon: "i-ph-cloud-check",
      title: "Files and database in sync",
      summary: "Storage first, database rows second",
      text: "If the insert fails, the uploaded files are deleted. A removed template's image is erased only after the commit."
    },
    {
      icon: "i-ph-text-aa",
      title: "Looks like Word",
      summary: "One LibreOffice version, bundled fonts",
      text: "Each conversion runs with its own profile and Word-compatibility settings. DOCX table widths are fixed up front."
    },
    {
      icon: "i-ph-ruler",
      title: "Stamps at real size",
      summary: "Size comes from the image's DPI",
      text: "Blank margins are trimmed. If the DPI gives 15–120 mm, that's used; otherwise 19% of the page's short edge (about 40 mm on A4)."
    },
    {
      icon: "i-ph-bug",
      title: "Disappearing pages",
      summary: "garbage=4 → garbage=3",
      text: "Stamping one page blanked others: PyMuPDF's optimisation merged identical page objects."
    },
    {
      icon: "i-ph-gauge",
      title: "No wasted memory",
      summary: "Streamed uploads, PDFs in ranges",
      text: "The BFF streams files to the API, the preview loads PDFs in 4 MB ranges, and status polling runs only while batches are active."
    }
  ],

  quality: [
    { area: "Backend", value: "80", detail: "tests: resolver, stamp sizing, queue, API" },
    { area: "Frontend", value: "53", detail: "tests: Vitest and Testing Library" },
    { area: "CI", value: "4", detail: "checks on push: ruff ×2, mypy, pytest" },
    { area: "Code", value: "≈20k", detail: "lines, 20 endpoints, 16 migrations" }
  ],

  nextSteps: [
    "Stream pages instead of keeping them all in memory",
    "Translate every error for the user",
    "Respect templates' validity dates"
  ],

  code: [
    {
      label: "Queue",
      explanation:
        "The worker claims a batch of files. SKIP LOCKED stops two processes taking the same file."
    },
    {
      label: "Done / error",
      explanation:
        "The result is written in its own transaction; a batch closes once none of its files are in progress."
    },
    {
      label: "Resolver",
      explanation:
        "The AI only describes the page — code decides. An ambiguous template is never chosen."
    },
    {
      label: "Stamping",
      explanation:
        "Image pixels are converted to PDF points; the stamp is centred and kept inside the page."
    },
    {
      label: "Interface",
      explanation:
        "A batch is one multipart request; the list is polled only while something is in progress."
    }
  ],

  ui: {
    sections: {
      overview: "Overview",
      flow: "How it's used",
      demo: "Demo",
      inside: "Inside",
      architecture: "Architecture",
      decisions: "Decisions",
      code: "Code"
    },
    sectionsNav: "Case study sections",
    back: "Projects",
    expand: "Full screen",
    collapse: "Exit full screen",
    expandTitle: "Full screen",
    collapseTitle: "Exit full screen (Esc)",
    kicker: "Case study · document automation",
    lead: "Upload a stack of contracts — get finished PDFs with a signature and seal, or a “true copy” stamp.",
    tryDemo: "Try the demo",
    howItWorks: "How it works",
    chapters: {
      problem: {
        title: "The problem",
        lead: "Legal routine that a machine can take over."
      },
      flow: { title: "How it's used", lead: "One screen, four steps." },
      demo: {
        title: "Try it yourself",
        lead: "A mock-up of the real interface: at the “AI looks” step you see what Dify found and what the code discarded. The sample contract is in Russian, like the service's documents."
      },
      inside: {
        title: "What's inside",
        lead: "One queue, one worker, two workflows. Click a stage."
      },
      architecture: {
        title: "Architecture",
        lead: "Requests answer at once; the heavy work happens in the worker."
      },
      decisions: { title: "Decisions", lead: "What was tricky and how it was solved." },
      code: { title: "Code", lead: "Real fragments from the project, without imports." }
    },
    before: "Before",
    after: "After",
    demoNote:
      "Organisations and people are fictional. The AI's answer is simulated in the browser; the PDFs are prepared in advance.",
    scenario: "Workflow",
    step: (n, total) => `Stage ${n} of ${total}`,
    resolverTitle: "AI observes, code decides",
    resolverLead:
      "The model never picks a stamp itself. An AI mistake becomes a clear processing error, not someone else's seal on a contract.",
    seenTitle: "Dify saw",
    rulesTitle: "Rules",
    decidedTitle: "Code decided",
    rawJson: "Dify's full answer (JSON)",
    archHint: "Click a block",
    lanes: { request: "Request", data: "Data", processing: "Processing" },
    more: "More",
    less: "Less",
    checks: "Checks",
    nextTitle: "What's next",
    codeTabs: "Code fragments",
    allProjects: "All projects",
    demo: {
      badge: "demo",
      user: "Demo lawyer",
      userInitial: "L",
      controls: "Processing controls",
      dropTitle: "Drop documents here",
      dropText: "PDF, Word, Excel or images, up to 30 MB",
      takeSample: "Use a sample contract",
      sourcePdf: "Original as PDF",
      fileBase: "Contract_DEMO-001",
      pages: "2 pages",
      size: "48 KB",
      fileState: { error: "error", done: "ready", busy: "processing" },
      status: { done: "Ready", error: "Error", busy: "Processing", uploaded: "Uploaded" },
      action: "Action",
      signingNote:
        "The signatory and the signature spot come from the document — nothing to choose.",
      simulateError: "Simulate an error",
      simulateErrorNote: "The AI won't find a signature block on the pages",
      templateLabel: "Certification template",
      templateGroup: "Template",
      sign: "Sign",
      certify: "Certify",
      pickTemplate: "Choose a template to certify the document.",
      batch: "Batch",
      oneFile: "1 file",
      errorDetail:
        "Dify returned no signature blocks. The resolver never guesses a stamp — the worker marks the file as an error and the original stays in storage.",
      codeLink: "code",
      liveDone: "Document ready",
      liveError: "Error: signature template not found",
      errorTitle: "Signature template not found.",
      errorNote: "This is how users see the message in the file list.",
      download: "Download PDF",
      retry: "Retry without the error",
      stop: "Stop",
      restart: "New batch",
      viewer: "Document preview",
      prevPage: "Previous page",
      nextPage: "Next page",
      compare: "Compare",
      before: "Before",
      after: "After",
      emptyViewer: "The document will appear here",
      dialogTitle: "What should happen to the documents?",
      dialogNote: "You can change the action before starting.",
      signingOption:
        "Facsimile signature with a seal. Place and signatory come from the document.",
      certOption: "A “true copy” stamp on every page from the chosen template.",
      cancel: "Cancel"
    },
    paper: {
      label: (page: number, stamped: boolean) =>
        `Sample contract, page ${page} of 2${stamped ? ", stamped" : ""}`,
      sealSeen: "seal · requisites · medium",
      sealSkipped: "skipped: these are requisites",
      signSeen: "signature · strong",
      signChosen: "chosen: template “Пример Б. Б.”"
    }
  }
};
