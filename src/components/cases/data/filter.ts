import type { ProjectCaseData } from "../types";

/** Request Filter: AI assessment of customer requests and tenders (August – November 2026). */
const filter: ProjectCaseData = {
  id: "filter",
  art: "filter",
  firstNode: "worker",
  bridge: true,
  stack: [
    "Python 3.12",
    "FastAPI",
    "Pydantic v2",
    "SQLite (WAL, FTS)",
    "PyMuPDF",
    "openpyxl · python-docx",
    "LibreOffice",
    "tesseract",
    "Dify",
    "LLM (OpenAI-совместимые)",
    "Tavily",
    "Next.js 16",
    "React 19",
    "TanStack Query",
    "Tailwind CSS 4",
    "LDAP · JWT",
    "Telegram Bot API",
    "nginx · pm2",
    "mypy --strict"
  ],
  code: [
    {
      path: "src/api/pauk_events.py",
      language: "python",
      code: `#: Сколько копить толчки, прежде чем отправить.
GATHER_SECONDS = 0.5
#: Паузы перед повторами, если Паук не ответил.
RETRY_PAUSES = (2.0, 10.0, 30.0)
#: Ответы, после которых повторять бесполезно: не тот ключ, адрес или формат.
FINAL_REFUSALS = frozenset({400, 401, 403, 404, 405, 422})

    async def _push(self, ids: list[str]) -> None:
        for attempt, pause in enumerate((0.0, *RETRY_PAUSES), start=1):
            if pause:
                await self._sleep(pause)
            try:
                status = await self._post(settings.PAUK_EVENTS_URL, settings.PAUK_SERVICE_KEY, ids)
            except httpx.HTTPError as exc:
                log.warning(
                    "Паук не ответил на толчок (%s), попытка %d", exc.__class__.__name__, attempt
                )
                continue
            if status < 300:
                return
            log.warning("Паук не принял толчок: ответ %d, попытка %d", status, attempt)
            if status in FINAL_REFUSALS:
                return
        log.warning("Толчок Паука не дошёл: %s — он узнает опросом", ids)`
    },
    {
      path: "src/api/db/queue.py",
      language: "python",
      code: `    async def claim(self, worker: str, *, lease_seconds: float) -> tuple[str, int] | None:
        now = datetime.now(UTC)
        async with self._connect() as connection:
            cursor = await connection.execute(
                """
                UPDATE runs SET worker = ?, lease_until = ?, attempts = attempts + 1,
                    stage = CASE WHEN stage = ? THEN ? ELSE stage END
                WHERE id = (
                    SELECT id FROM runs
                    WHERE status = ? AND queued_at IS NOT NULL
                      AND (worker IS NULL OR lease_until IS NULL OR lease_until < ?)
                    ORDER BY queued_at, id LIMIT 1
                )
                RETURNING id, attempts
                """,
                (worker, (now + timedelta(seconds=lease_seconds)).isoformat(),
                 Stage.QUEUED.value, Stage.EXTRACTION.value, Status.RUNNING.value,
                 now.isoformat()),
            )
            row = await cursor.fetchone()
            await connection.commit()
        return (str(row["id"]), int(row["attempts"])) if row else None`
    },
    {
      path: "src/integrations/dify_gate.py",
      language: "python",
      code: `    async def acquire(self, owner: str) -> None:
        if self._busy < self._slots and not self._waiting:
            self._busy += 1
            return
        future: asyncio.Future[None] = asyncio.get_running_loop().create_future()
        self._waiting.setdefault(owner, deque()).append(future)
        await future  # … в оригинале — ещё обработка отмены

    def release(self) -> None:
        while self._waiting:
            owner, queue = next(iter(self._waiting.items()))
            future = queue.popleft()
            if queue:
                # Следующее место — следующей заявке, а не этой же.
                self._waiting.move_to_end(owner)
            else:
                del self._waiting[owner]
            if not future.done():
                future.set_result(None)
                return  # место передано из рук в руки, занятых столько же
        self._busy -= 1`
    }
  ],
  ru: {
    title: "Фильтр заявок",
    kicker: "Кейс · ИИ-оценка заявок",
    lead: "Заявка клиента или тендер в любом формате превращается в карточку: позиции с источником каждого значения, решение «брать / проверить / отклонить», балл 0–100 и правило, которое его определило.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "Что это",
        value: "Оценка заявок для продаж и тендерного отдела"
      },
      {
        icon: "i-ph-files",
        term: "На входе",
        value: "Excel, Word, PDF, сканы, письма, архивы"
      },
      {
        icon: "i-ph-scales",
        term: "Решение",
        value: "Брать, проверить или отклонить, балл 0–100"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Сроки",
        value: "Август — ноябрь 2026, в работе"
      }
    ],
    problem: {
      before: [
        "Письма, спецификации и тендерные пакеты разбирали руками",
        "Перспективность считали по Excel-книгам скоринга",
        "Тендер из Паука переносили вручную: файлы и текст карточки"
      ],
      after: [
        "Одна загрузка — карточка с вердиктом, баллом и «почему так»",
        "Правила с постоянными кодами, решения людей сравниваются с моделью",
        "«В фильтр» в Пауке заводит заявку, вердикт возвращается сам"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Загрузить заявку",
        text: "Все файлы одной заявки перетаскиванием (или «В фильтр» в Пауке), при желании приписка и ИНН."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Дождаться разбора",
        text: "Место в очереди, стадия и прогноз: чтение файлов, разбор смысла, проверка, сопоставление."
      },
      {
        icon: "i-ph-identification-card",
        title: "Прочитать карточку",
        text: "Вердикт, балл, решившее правило, позиции с номенклатурой и ценами, карточка заказчика."
      },
      {
        icon: "i-ph-check-square-offset",
        title: "Решить",
        text: "«Принять» или «Отклонить» с причиной; решения идут в метрики и обратно в Паук."
      }
    ],
    stages: [
      {
        icon: "i-ph-queue",
        title: "Очередь",
        tool: "SQLite · отдельный процесс",
        detail:
          "Загрузка только ставит заявку в очередь. Обработчик забирает её одним UPDATE … RETURNING с арендой, до трёх попыток, при остановке спокойно доделывает начатое."
      },
      {
        icon: "i-ph-file-magnifying-glass",
        title: "Чтение файлов",
        tool: "PyMuPDF · LibreOffice · tesseract",
        detail:
          "PDF, Excel, Word, презентации, картинки, письма и архивы до 4 уровней вложенности — без попыток понять смысл. Дубли и анкеты отсеиваются."
      },
      {
        icon: "i-ph-brain",
        title: "Разбор смысла",
        tool: "Dify · LLM",
        detail:
          "Модель видит загрузку целиком: сколько заявок, кто клиент, какие позиции. В больших таблицах она отдаёт только ссылки на ячейки, значения копирует код."
      },
      {
        icon: "i-ph-shield-check",
        title: "Проверка данных",
        tool: "Pydantic",
        detail:
          "Схема, контрольная сумма ИНН, диапазоны чисел; 28 написаний единиц сводятся к 9. Противоречия уходят в предупреждения, а не решаются молча."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Сопоставление",
        tool: "Dify · Tavily",
        detail:
          "Номенклатура и цены по каталогу, заказчик — по истории предложений и в интернете, условия и правила. Ответ каждой роли проверяется кодом."
      },
      {
        icon: "i-ph-gavel",
        title: "Итог",
        tool: "Python + роль decision",
        detail:
          "Код считает факты и балл, последняя роль модели выносит вердикт и 2–4 пункта «почему так» по правилам. Модель не ответила — решает человек."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Веб-интерфейс",
          tech: "Next.js 16 · React 19",
          text: "Загрузка, журнал по разделам, карточка, правила, метрики, расход и ассистент."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "40 операций: заявки, решения, метрики, ассистент, вход и связка с Пауком."
        },
        {
          id: "sso",
          name: "Вход",
          tech: "LDAP · JWT",
          text: "Active Directory, роли: админ, сотрудник, наблюдатель."
        },
        {
          id: "pauk",
          name: "Вход для Паука",
          tech: "служебный ключ",
          text: "Действие от имени сотрудника: заявка, состояние, решение, повтор."
        }
      ],
      data: [
        {
          id: "runs",
          name: "Заявки и очередь",
          tech: "SQLite · WAL",
          text: "13 таблиц: заявки, попытки, вызовы модели, сохранённые пачки разбора, ревизии."
        },
        {
          id: "files",
          name: "Оригиналы",
          tech: "диск",
          text: "Файлы заявки по её номеру — их видно рядом с карточкой."
        },
        {
          id: "refs",
          name: "Справочники",
          tech: "SQLite · FTS",
          text: "Книга скоринга, каталог номенклатуры с полнотекстовым поиском, история предложений."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Обработчик",
          tech: "Python",
          text: "Очередь с арендой, контрольная точка после разбора, честная раздача мест к модели."
        },
        {
          id: "dify",
          name: "Роли модели",
          tech: "Dify",
          text: "11 узлов: разбор, номенклатура, заказчик, условия, правила и итоговое решение."
        },
        {
          id: "search",
          name: "Поиск заказчика",
          tech: "Tavily",
          text: "Ищет компанию в интернете, если её нет в истории."
        },
        {
          id: "watchdog",
          name: "Сторож",
          tech: "cron · Telegram",
          text: "22 проверки раз в минуту; в будни сломанные заявки — в чат."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-brain",
        title: "Смысл — модели, строгость — коду",
        summary: "Четыре стадии с жёсткими правилами",
        text: "Ключевые слова разрешены только в разборе, нет данных — пусто, а не догадка. У каждого значения есть происхождение: файл, место и уверенность."
      },
      {
        icon: "i-ph-table",
        title: "Карта ячеек",
        summary: "Модель размечает, код копирует числа",
        text: "В больших таблицах модель искажала количества — в замере 20 673 превратилось в 180. Теперь она отдаёт только диапазоны и ссылки на ячейки, а значения переносит код с проверкой покрытия."
      },
      {
        icon: "i-ph-queue",
        title: "Пики нагрузки",
        summary: "Очередь, отдельный процесс, слоты по кругу",
        text: "Обработка жила внутри веб-процесса, и перезапуск обрывал всё. Очередь с арендой и честная раздача мест к модели между заявками: журнал отвечает за ~16 мс вместо 0,5–1 с."
      },
      {
        icon: "i-ph-arrow-counter-clockwise",
        title: "Продолжение с места обрыва",
        summary: "Пачки по 80 строк сохраняются сразу",
        text: "Вызов модели обрывался на 600 секундах, и повтор начинал с нуля. Теперь каждая проверенная пачка сохраняется, и повтор спрашивает модель только о недостающем."
      },
      {
        icon: "i-ph-code",
        title: "Промпты как код",
        summary: "Задания живут в репозитории",
        text: "Промпты правили в админке, и они расходились с кодом. Теперь задания и схемы ответов в репозитории, файл воркфлоу собирается скриптом, а отпечаток сверяют бэкенд и сторож."
      },
      {
        icon: "i-ph-shield-check",
        title: "Безопасный ассистент",
        summary: "SQL только на чтение, проверяет сама база",
        text: "Тексты заявок пишут внешние клиенты — возможна атака через промпт. Соединение только на чтение, разрешены лишь SELECT, один оператор, до 200 строк и 8 секунд; действий у ассистента нет."
      }
    ],
    numbers: [
      { area: "Тесты", value: "2154", detail: "тестов бэкенда и 103 — интерфейса" },
      { area: "API", value: "40", detail: "операций, 5 из них — связка с Пауком" },
      { area: "Решения", value: "16", detail: "архитектурных записей (ADR)" },
      { area: "История", value: "910", detail: "коммитов, август — ноябрь 2026" }
    ],
    code: [
      {
        label: "Толчок Пауку",
        explanation:
          "Перемены копятся полсекунды и уходят пачкой номеров с тремя повторами. Если не дошло — не беда: Паук всё равно узнает опросом."
      },
      {
        label: "Очередь в SQLite",
        explanation:
          "Заявка забирается одним атомарным UPDATE … RETURNING с арендой: упавший обработчик не держит её вечно."
      },
      {
        label: "Места к модели",
        explanation:
          "Свободное место отдаётся следующей заявке по кругу, а не той же — большой тендер не займёт все вызовы модели."
      }
    ]
  },
  en: {
    title: "Request Filter",
    kicker: "Case · AI assessment of requests",
    lead: "A customer request or a tender in any format becomes a card: items with the source of every value, a “take / check / reject” verdict, a 0–100 score and the rule that decided it.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "What",
        value: "Request assessment for sales and tenders"
      },
      {
        icon: "i-ph-files",
        term: "Input",
        value: "Excel, Word, PDF, scans, e-mails, archives"
      },
      {
        icon: "i-ph-scales",
        term: "Verdict",
        value: "Take, check or reject, a 0–100 score"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Timeline",
        value: "August — November 2026, in use"
      }
    ],
    problem: {
      before: [
        "E-mails, specs and tender packs were sorted by hand",
        "Prospects were scored in Excel workbooks",
        "Tenders from the Spider were moved by hand: files and card text"
      ],
      after: [
        "One upload — a card with a verdict, a score and the reasons",
        "Rules with fixed codes; people's decisions are compared to the model's",
        "“To the Filter” in the Spider creates a request; the verdict returns itself"
      ]
    },
    steps: [
      {
        icon: "i-ph-upload-simple",
        title: "Upload",
        text: "Drop all files of one request (or press “To the Filter” in the Spider), with an optional note and tax ID."
      },
      {
        icon: "i-ph-hourglass-medium",
        title: "Wait for the reading",
        text: "Queue place, stage and an estimate: reading files, understanding, checks, matching."
      },
      {
        icon: "i-ph-identification-card",
        title: "Read the card",
        text: "Verdict, score, the deciding rule, items matched to the catalogue with prices, the customer card."
      },
      {
        icon: "i-ph-check-square-offset",
        title: "Decide",
        text: "“Accept” or “Reject” with a reason; decisions feed the metrics and go back to the Spider."
      }
    ],
    stages: [
      {
        icon: "i-ph-queue",
        title: "Queue",
        tool: "SQLite · separate process",
        detail:
          "An upload only queues the request. A worker claims it with one UPDATE … RETURNING and a lease, up to three attempts, and finishes its work calmly on shutdown."
      },
      {
        icon: "i-ph-file-magnifying-glass",
        title: "Reading files",
        tool: "PyMuPDF · LibreOffice · tesseract",
        detail:
          "PDF, Excel, Word, slides, images, e-mails and archives nested up to 4 levels — with no attempt at meaning yet. Duplicates and forms are dropped."
      },
      {
        icon: "i-ph-brain",
        title: "Understanding",
        tool: "Dify · LLM",
        detail:
          "The model sees the whole upload: how many requests, which customer, which items. In big tables it returns only cell references; code copies the values."
      },
      {
        icon: "i-ph-shield-check",
        title: "Validation",
        tool: "Pydantic",
        detail:
          "Schema, the tax ID checksum, number ranges; 28 spellings of units fold into 9. Conflicts become warnings, never silent fixes."
      },
      {
        icon: "i-ph-magnifying-glass",
        title: "Matching",
        tool: "Dify · Tavily",
        detail:
          "Items and prices against the catalogue, the customer against past quotes and the web, terms and rules. Code checks every role's answer."
      },
      {
        icon: "i-ph-gavel",
        title: "Verdict",
        tool: "Python + decision role",
        detail:
          "Code computes the facts and score; the last model role gives the verdict and 2–4 reasons under the rules. If the model doesn't answer, a person decides."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Web app",
          tech: "Next.js 16 · React 19",
          text: "Upload, a sectioned log, the card, rules, metrics, spending and the assistant."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "40 operations: requests, decisions, metrics, the assistant, sign-in and the Spider link."
        },
        {
          id: "sso",
          name: "Sign-in",
          tech: "LDAP · JWT",
          text: "Active Directory with roles: admin, user, viewer."
        },
        {
          id: "pauk",
          name: "Spider entry",
          tech: "service key",
          text: "Acts on behalf of an employee: request, state, decision, rerun."
        }
      ],
      data: [
        {
          id: "runs",
          name: "Requests & queue",
          tech: "SQLite · WAL",
          text: "13 tables: requests, attempts, model calls, saved reading batches, revisions."
        },
        {
          id: "files",
          name: "Originals",
          tech: "disk",
          text: "A request's files by its id — shown next to the card."
        },
        {
          id: "refs",
          name: "Reference data",
          tech: "SQLite · FTS",
          text: "The scoring book, a catalogue with full-text search, quote history."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Worker",
          tech: "Python",
          text: "A leased queue, a checkpoint after reading, fair sharing of model slots."
        },
        {
          id: "dify",
          name: "Model roles",
          tech: "Dify",
          text: "11 nodes: reading, items, customer, terms, rules and the final decision."
        },
        {
          id: "search",
          name: "Customer search",
          tech: "Tavily",
          text: "Looks the company up on the web if it isn't in the history."
        },
        {
          id: "watchdog",
          name: "Watchdog",
          tech: "cron · Telegram",
          text: "22 checks every minute; on weekdays broken requests go to a chat."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-brain",
        title: "Meaning to the model, rigour to code",
        summary: "Four stages with hard rules",
        text: "Keywords are allowed only in reading; missing data is empty, not a guess. Every value carries its origin: the file, the place and the confidence."
      },
      {
        icon: "i-ph-table",
        title: "A cell map",
        summary: "The model marks up, code copies numbers",
        text: "In big tables the model garbled quantities — in one test 20,673 became 180. Now it returns only ranges and cell references, and code copies the values and checks coverage."
      },
      {
        icon: "i-ph-queue",
        title: "Load peaks",
        summary: "A queue, a separate process, round-robin slots",
        text: "Processing lived in the web process, and a restart killed everything. A leased queue and fair model slots across requests: the log answers in ~16 ms instead of 0.5–1 s."
      },
      {
        icon: "i-ph-arrow-counter-clockwise",
        title: "Resume where it broke",
        summary: "80-row batches saved as they pass",
        text: "Model calls were cut at 600 seconds and a retry started from scratch. Now each checked batch is saved, and a retry only asks the model about what's missing."
      },
      {
        icon: "i-ph-code",
        title: "Prompts as code",
        summary: "Tasks live in the repository",
        text: "Prompts were edited in an admin panel and drifted from the code. Now tasks and answer schemas are in the repo, the workflow file is generated, and both backend and watchdog verify its fingerprint."
      },
      {
        icon: "i-ph-shield-check",
        title: "A safe assistant",
        summary: "Read-only SQL, enforced by the database",
        text: "Request texts come from outside customers — prompt injection is possible. The connection is read-only, only SELECT is allowed, one statement, up to 200 rows and 8 seconds; the assistant has no actions."
      }
    ],
    numbers: [
      { area: "Tests", value: "2154", detail: "backend tests and 103 for the UI" },
      { area: "API", value: "40", detail: "operations, 5 of them for the Spider" },
      { area: "Decisions", value: "16", detail: "architecture decision records" },
      { area: "History", value: "910", detail: "commits, August — November 2026" }
    ],
    code: [
      {
        label: "Pushing the Spider",
        explanation:
          "Changes gather for half a second and go out as a batch of numbers with three retries. If it fails, no harm: the Spider learns by polling anyway."
      },
      {
        label: "Queue in SQLite",
        explanation:
          "A request is claimed with one atomic UPDATE … RETURNING and a lease: a crashed worker doesn't hold it forever."
      },
      {
        label: "Model slots",
        explanation:
          "A free slot goes to the next request in turn, not the same one — a big tender can't take every model call."
      }
    ]
  }
};

export default filter;
