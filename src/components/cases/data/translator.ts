import type { ProjectCaseData } from "../types";

/** AI document translator that keeps the layout (in production, July–November 2026). */
const translator: ProjectCaseData = {
  id: "translator",
  art: "translator",
  firstNode: "pipeline",
  stack: [
    "Python 3.12",
    "FastAPI",
    "SQLAlchemy 2 (async)",
    "PostgreSQL 16",
    "Alembic",
    "PyMuPDF · HarfBuzz",
    "OpenCV",
    "PaddleOCR",
    "Dify",
    "LLM (OpenAI)",
    "LibreOffice",
    "pymorphy3",
    "Next.js 16",
    "React 19",
    "TanStack Query",
    "Tailwind CSS 4",
    "pdf.js",
    "LDAP · JWT",
    "Docker Compose"
  ],
  code: [
    {
      path: "src/services/ai_pipeline/service.py",
      language: "python",
      code: `    async def one(n: int) -> tuple[int, bytes | None, str]:
        rgb = np.asarray(pages[n].original)
        boxes = _line_boxes(readings[n], pages[n].original.size)
        plain = (
            readings[n].route != "vision"
            and boxes
            and not (await clock.thread(local_erase.verdict, rgb, boxes)).needs_ai
        )
        if plain:
            return n, await local(rgb, boxes, n), "local"
        try:
            async with gate:
                png, note = await dify.erase(await _page_png(pages[n]), f"{name}-p{n}.png")
        except AiPipelineError as error:
            png, note = None, error.message
        if png is not None:
            return n, png, "ai"
        # the AI eraser did not answer (no such task published, a spend limit, an error): the page is
        # filled on the server rather than withheld -- a seal under the print may keep a white trace
        logger.warning("page %s: the AI erasing failed, filled on the server: %s", n, note[:300])
        return n, await local(rgb, boxes, n), f"local, AI failed: {note[:200]}"`
    },
    {
      path: "src/services/ai_pipeline/typeset.py",
      language: "python",
      code: `def _ladder(p: Paragraph, own: float, goal: float) -> tuple[float, tuple[str, ...]]:
    """Largest scale up to \`\`goal\`\` the paragraph fits at: hyphens, tighter leading, narrow face."""
    if own >= goal:
        return goal, ()
    narrow = ("narrow",) * (p.family in NARROW and not p.narrow)
    low = p.room[3] - p.room[1] < 2 * TIGHT_LEADING * p.size * goal
    # a room lower than two lines: one line, measured by its letters
    ladders: list[tuple[str, ...]] = [("line", *narrow)] if low else []
    if not low or int(p.note.get("lines") or 1) >= 2:
        ladders.append(
            ("hyphens",) * bool(_RUSSIAN.search(p.text()))
            + ("leading",) * (p.leading > TIGHT_LEADING and p.person_leading is None)
            + narrow
        )
    best, best_aids = own, cast(tuple[str, ...], ())
    for steps in ladders:
        for n in range(1, len(steps) + 1):
            aids = steps[:n]
            aided = _aided(p, aids)
            scale = _line_scale(aided) if "line" in aids else max(_dry_run(aided, 0.0)[0], 1e-3)
            if scale >= goal:
                return goal, aids
            if scale > best:
                best, best_aids = scale, aids
    return best, best_aids`
    },
    {
      path: "src/services/ai_pipeline/typeset.py",
      language: "python",
      code: `def render_pdf(
    background: np.ndarray,
    paragraphs: list[Paragraph],
    page_size: tuple[float, float],
    top: Image.Image | None = None,
) -> bytes:
    """One PDF page: the erased background as an image, translations as real text over it, seals on top."""
    h, w = background.shape[:2]
    stream = _png_bytes(background)
    with pdf_operation(), pymupdf.open() as sheet, pymupdf.open() as document:
        drawn = sheet.new_page(width=w, height=h)
        ground = drawn.insert_image(drawn.rect, stream=stream)
        for p in paragraphs:
            place(drawn, p)
        _lighter_ground(drawn, ground, background, stream)
        if top is not None:
            # the page's seals over its translations, as the prod lays them (\`\`seals.overlay\`\`)
            buffer = io.BytesIO()
            top.save(buffer, format="PNG")
            drawn.insert_image(drawn.rect, stream=buffer.getvalue())
        page = document.new_page(width=page_size[0], height=page_size[1])
        page.show_pdf_page(page.rect, sheet, 0, keep_proportion=False)
        return packed(document)`
    }
  ],
  ru: {
    title: "Переводчик документов",
    kicker: "Кейс · перевод с сохранением макета",
    lead: "Загружаешь скан, PDF, Word или Excel — получаешь тот же документ на другом языке: перевод стоит на месте оригинала, с теми же таблицами, печатями и подписями. Поправить можно прямо на листе.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "Что это",
        value: "Сервис перевода документов для производства"
      },
      {
        icon: "i-ph-files",
        term: "На входе",
        value: "PDF, сканы, фото, Word, Excel, чертежи"
      },
      {
        icon: "i-ph-translate",
        term: "Языки",
        value: "На русский, английский и ещё 4 языка"
      },
      { icon: "i-ph-rocket-launch", term: "Статус", value: "В работе с июля 2026" }
    ],
    problem: {
      before: [
        "Сканы и чертежи перепечатывали в Word и заново собирали таблицы",
        "Память переводов Trados работала только с текстом, сканы мимо неё",
        "Одна подпись на разных листах — разные переводы, числа легко исказить"
      ],
      after: [
        "Файл на входе — тот же документ на выходе, перевод на месте оригинала",
        "Trados и глоссарий подставляются даже на сканах, термины едины",
        "Правка поверх листа, пересобирается только изменённое"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Загрузка",
        text: "Доменная учётка, до 4 файлов, языки и при желании указания и образец перевода."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Ход обработки",
        text: "Видно этапы: распознаём, разбираем макет, ищем в памяти, переводим, собираем, проверяем."
      },
      {
        icon: "i-ph-columns",
        title: "Просмотр и правка",
        text: "Оригинал и перевод рядом с общей прокруткой; текст, кегль, поворот и ластик прямо на листе."
      },
      {
        icon: "i-ph-download-simple",
        title: "Скачивание",
        text: "Сохранение пересобирает изменённые листы, у PDF появляется новая версия."
      }
    ],
    stages: [
      {
        icon: "i-ph-signpost",
        title: "Приём и маршрут",
        tool: "PyMuPDF · LibreOffice",
        detail:
          "Картинка становится PDF, старые форматы Office поднимаются до docx и xlsx. Каждая страница получает тип: текстовая, скан, гибрид или чертёж — от этого зависит путь."
      },
      {
        icon: "i-ph-scan",
        title: "Распознавание",
        tool: "TextIn · PaddleOCR",
        detail:
          "Строки, клетки таблиц и блоки. Повёрнутые поля чертежа вырезаются и читаются отдельно; ответ проверяется правилами — ни одной строки без места, ни одной дважды."
      },
      {
        icon: "i-ph-books",
        title: "Память и перевод",
        tool: "LLM · Trados · глоссарий",
        detail:
          "Сначала поиск в памяти переводов и один запрос к модели за словарём и темой документа, потом листы переводятся параллельно с этим контекстом."
      },
      {
        icon: "i-ph-eraser",
        title: "Стирание оригинала",
        tool: "OpenCV · ИИ для узоров",
        detail:
          "Простой фон стирается на сервере маской чернил; ИИ-перерисовка — только для листов с узорным фоном. Линии таблиц, печати и подписи остаются."
      },
      {
        icon: "i-ph-text-aa",
        title: "Набор в макет",
        tool: "PyMuPDF · HarfBuzz",
        detail:
          "Кегль как у оригинала — один на стиль и колонку. Не влезает — переносы, интерлиньяж, узкое начертание, и только потом мельче, но не ниже 6,5 pt."
      },
      {
        icon: "i-ph-file-pdf",
        title: "Сборка",
        tool: "PyMuPDF · fontTools",
        detail:
          "Лист PDF из трёх слоёв: стёртый фон, настоящий выделяемый текст перевода и печати поверх. Word и Excel записываются обратно в свой формат."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Веб-интерфейс",
          tech: "Next.js 16 · React 19",
          text: "Загрузка, ход обработки, просмотр рядом с оригиналом, редактор листа и база переводов."
        },
        {
          id: "bff",
          name: "Прокси",
          tech: "Next.js route handlers",
          text: "Браузер ходит только сюда; токен лежит в httponly-куке."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "54 маршрута по схеме router → service → repository; вход через LDAP и JWT, роли."
        }
      ],
      data: [
        {
          id: "db",
          name: "База",
          tech: "PostgreSQL 16",
          text: "16 таблиц: документы, страницы, задания, надписи, правки, глоссарий и память переводов."
        },
        {
          id: "files",
          name: "Файлы",
          tech: "диск, с версиями",
          text: "Оригинал, план листа, стёртый фон и версии готового PDF."
        },
        {
          id: "cache",
          name: "Кэш ответов ИИ",
          tech: "по хешу запроса",
          text: "Прерванный прогон продолжается без повторной оплаты запросов."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Воркер",
          tech: "Python",
          text: "Отдельный процесс с очередью в PostgreSQL; задания переживают перезапуск."
        },
        {
          id: "pipeline",
          name: "Конвейер листа",
          tech: "≈25k строк Python",
          text: "Чтение, память, перевод, стирание, набор и проверка; набор листов идёт в пуле процессов."
        },
        {
          id: "dify",
          name: "ИИ-задачи",
          tech: "Dify",
          text: "Распознавание макета, перевод, сокращение, редактура и проверка — отдельными задачами."
        },
        {
          id: "ocr",
          name: "Распознаватель строк",
          tech: "PaddleOCR",
          text: "В своей среде, ищет текст, которому основной распознаватель не дал координат."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-eraser",
        title: "Стирание дешевле в разы",
        summary: "ИИ только для узорного фона",
        text: "ИИ-перерисовка была 96% цены листа. Простой фон теперь стирается на сервере маской чернил; в эталонном наборе так стёрты 90 листов из 105. Если ИИ не ответил, лист всё равно стирается локально."
      },
      {
        icon: "i-ph-arrows-in",
        title: "Перевод длиннее оригинала",
        summary: "«Лестница» подгонки и пол читаемости",
        text: "Кегль подбирается на стиль, таблицу и колонку, а не по самому тесному абзацу. «Влезло» проверяется пробным набором тем же движком; если нет — модель просят дать короткую форму."
      },
      {
        icon: "i-ph-books",
        title: "Одни термины на весь документ",
        summary: "Память документа до перевода листов",
        text: "Словарь и тема документа собираются одним запросом, повторы приводятся к одному варианту. Числа, допуски и коды заменяются метками и возвращаются как были."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Проверка того, что нарисовано",
        summary: "Код ловит то, что модель пропустила",
        text: "Перевод на печати, вылез из клетки, низкий контраст, недостёртый оригинал — всё это ищется на готовом листе. Любая правка набора принимается, только если 123 «трудных листа» не стали хуже."
      },
      {
        icon: "i-ph-lightning",
        title: "Быстрая правка",
        summary: "Перерисовываются только задетые абзацы",
        text: "Правка занимала около 25 секунд, из них 18 — полный перенабор листа. Теперь состояние листа хранится по слоям, а в PDF заменяется только этот лист; есть отмена, возврат и защита от одновременных правок."
      },
      {
        icon: "i-ph-coins",
        title: "Долгие и дорогие прогоны",
        summary: "Кэш ответов и параллельный набор",
        text: "Каждый ответ ИИ хранится под хешем запроса, лимиты сервиса пережидаются без траты попыток. Набор листов в отдельных процессах: 5 листов — 53 секунды вместо 93."
      }
    ],
    numbers: [
      { area: "Тесты", value: "1460", detail: "тестов бэкенда и 36 — интерфейса" },
      { area: "API", value: "54", detail: "маршрута, 16 таблиц и 35 миграций" },
      {
        area: "Скорость",
        value: "9,8 мин",
        detail: "медиана на многостраничный документ, 110 прогонов"
      },
      { area: "История", value: "1679", detail: "коммитов, июль — ноябрь 2026" }
    ],
    code: [
      {
        label: "Где стирать",
        explanation:
          "Лист с простым фоном стирается на сервере; к ИИ идут только узорные. Если ИИ не ответил, лист не задерживается — его стирают локально."
      },
      {
        label: "Лестница подгонки",
        explanation:
          "Перевод пробуют вписать с помощью переносов, плотного интерлиньяжа и узкого начертания, прежде чем уменьшать кегль. Каждая ступень проверяется пробным набором."
      },
      {
        label: "Сборка листа",
        explanation:
          "Лист PDF из трёх слоёв: стёртый фон картинкой, перевод настоящим текстом (его можно выделить и найти) и печати поверх."
      }
    ]
  },
  en: {
    title: "Document Translator",
    kicker: "Case · translation that keeps the layout",
    lead: "Upload a scan, PDF, Word or Excel file — get the same document in another language: the translation sits where the original was, with the same tables, seals and signatures. Fix it right on the page.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "What",
        value: "Document translation for a manufacturer"
      },
      {
        icon: "i-ph-files",
        term: "Input",
        value: "PDFs, scans, photos, Word, Excel, drawings"
      },
      {
        icon: "i-ph-translate",
        term: "Languages",
        value: "Into Russian, English and 4 more"
      },
      { icon: "i-ph-rocket-launch", term: "Status", value: "In use since July 2026" }
    ],
    problem: {
      before: [
        "Scans and drawings were retyped in Word and tables rebuilt by hand",
        "The Trados translation memory only worked with text, not scans",
        "One caption, different translations on different pages; numbers easy to garble"
      ],
      after: [
        "A file in, the same document out, the translation in place of the original",
        "Trados and the glossary apply even to scans; terms stay consistent",
        "Edits right on the page; only what changed is rebuilt"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Upload",
        text: "A domain account, up to 4 files, the languages, and optional instructions and a sample translation."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Progress",
        text: "The stages show up: recognise, read the layout, search memory, translate, assemble, check."
      },
      {
        icon: "i-ph-columns",
        title: "Review and edit",
        text: "Original and translation side by side with shared scrolling; text, size, rotation and an eraser on the page."
      },
      {
        icon: "i-ph-download-simple",
        title: "Download",
        text: "Saving rebuilds the edited pages; the PDF gets a new version."
      }
    ],
    stages: [
      {
        icon: "i-ph-signpost",
        title: "Intake and routing",
        tool: "PyMuPDF · LibreOffice",
        detail:
          "An image becomes a PDF; old Office formats are upgraded to docx and xlsx. Every page gets a type — text, scan, hybrid or drawing — which picks its route."
      },
      {
        icon: "i-ph-scan",
        title: "Recognition",
        tool: "TextIn · PaddleOCR",
        detail:
          "Lines, table cells and blocks. Rotated drawing frames are cut out and read separately; rules check the answer — no line without a place, none counted twice."
      },
      {
        icon: "i-ph-books",
        title: "Memory and translation",
        tool: "LLM · Trados · glossary",
        detail:
          "First a translation-memory search and one model call for the document's glossary and topic, then pages are translated in parallel with that context."
      },
      {
        icon: "i-ph-eraser",
        title: "Erasing the original",
        tool: "OpenCV · AI for patterns",
        detail:
          "Plain backgrounds are erased on the server with an ink mask; AI repainting only for patterned ones. Table lines, seals and signatures stay."
      },
      {
        icon: "i-ph-text-aa",
        title: "Typesetting",
        tool: "PyMuPDF · HarfBuzz",
        detail:
          "The size of the original — one per style and column. If it doesn't fit: hyphens, tighter leading, a narrow face, and only then smaller, never below 6.5 pt."
      },
      {
        icon: "i-ph-file-pdf",
        title: "Assembly",
        tool: "PyMuPDF · fontTools",
        detail:
          "A PDF page in three layers: the erased background, real selectable translated text and the seals on top. Word and Excel are written back to their own format."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Web app",
          tech: "Next.js 16 · React 19",
          text: "Upload, progress, side-by-side review, the page editor and the translation base."
        },
        {
          id: "bff",
          name: "Proxy",
          tech: "Next.js route handlers",
          text: "The browser only talks to these; the token sits in an httponly cookie."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "54 routes in router → service → repository layers; LDAP and JWT sign-in, roles."
        }
      ],
      data: [
        {
          id: "db",
          name: "Database",
          tech: "PostgreSQL 16",
          text: "16 tables: documents, pages, jobs, captions, edits, the glossary and translation memory."
        },
        {
          id: "files",
          name: "Files",
          tech: "disk, versioned",
          text: "The original, the page plan, the erased background and versions of the final PDF."
        },
        {
          id: "cache",
          name: "AI answer cache",
          tech: "by request hash",
          text: "An interrupted run resumes without paying for the same requests again."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Worker",
          tech: "Python",
          text: "A separate process with a queue in PostgreSQL; jobs survive restarts."
        },
        {
          id: "pipeline",
          name: "Page pipeline",
          tech: "≈25k lines of Python",
          text: "Reading, memory, translation, erasing, typesetting and checks; pages are set in a process pool."
        },
        {
          id: "dify",
          name: "AI tasks",
          tech: "Dify",
          text: "Layout recognition, translation, shortening, editing and review as separate tasks."
        },
        {
          id: "ocr",
          name: "Line recogniser",
          tech: "PaddleOCR",
          text: "In its own environment; finds text the main recogniser gave no coordinates for."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-eraser",
        title: "Erasing at a fraction of the cost",
        summary: "AI only for patterned backgrounds",
        text: "AI repainting was 96% of a page's cost. Plain backgrounds are now erased on the server with an ink mask — 90 of 105 pages in the reference set. If the AI fails, the page is still erased locally."
      },
      {
        icon: "i-ph-arrows-in",
        title: "Translations run longer",
        summary: "A fitting “ladder” with a readability floor",
        text: "Size is chosen per style, table and column, not by the tightest paragraph. “It fits” is checked by a real trial set with the same engine; if not, the model is asked for a shorter form."
      },
      {
        icon: "i-ph-books",
        title: "One set of terms per document",
        summary: "Document memory before the pages",
        text: "The glossary and topic come from one call, repeats are unified. Numbers, tolerances and codes are swapped for tokens and restored exactly."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Checking what was drawn",
        summary: "Code catches what the model missed",
        text: "Text over a seal, spilling out of a cell, low contrast, leftovers of the original — all searched on the finished page. A typesetting change is accepted only if 123 “hard pages” don't get worse."
      },
      {
        icon: "i-ph-lightning",
        title: "Fast edits",
        summary: "Only the touched paragraphs are redrawn",
        text: "An edit took about 25 seconds, 18 of them a full re-set of the page. Now the page is stored in layers and only that page is replaced in the PDF; with undo, redo and protection from concurrent edits."
      },
      {
        icon: "i-ph-coins",
        title: "Long, costly runs",
        summary: "Answer cache and parallel typesetting",
        text: "Every AI answer is kept under its request hash; rate limits are waited out without spending retries. Pages are set in separate processes: 5 pages in 53 seconds instead of 93."
      }
    ],
    numbers: [
      {
        area: "Tests",
        value: "1460",
        detail: "backend tests, plus 36 for the interface"
      },
      { area: "API", value: "54", detail: "routes, 16 tables and 35 migrations" },
      {
        area: "Speed",
        value: "9.8 min",
        detail: "median per multi-page document, 110 runs"
      },
      { area: "History", value: "1679", detail: "commits, July — November 2026" }
    ],
    code: [
      {
        label: "Where to erase",
        explanation:
          "Plain pages are erased on the server; only patterned ones go to the AI. If the AI doesn't answer, the page isn't held back — it's erased locally."
      },
      {
        label: "Fitting ladder",
        explanation:
          "The translation tries hyphens, tighter leading and a narrow face before the size goes down. Each step is checked with a trial set."
      },
      {
        label: "Assembling a page",
        explanation:
          "A PDF page in three layers: the erased background as an image, the translation as real text (selectable and searchable), and the seals on top."
      }
    ]
  }
};

export default translator;
