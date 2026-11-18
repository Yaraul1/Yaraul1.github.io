import type { ProjectCaseData } from "../types";

/** Tender Spider: tenders from an aggregator and from mail, worked on to 1C (Oct 2025 – Nov 2026). */
const spider: ProjectCaseData = {
  id: "spider",
  art: "spider",
  firstNode: "watcher",
  bridge: true,
  stack: [
    "Python 3.13",
    "FastAPI",
    "SQLAlchemy 2 (async)",
    "PostgreSQL",
    "Alembic",
    "IMAP",
    "Playwright",
    "Dify",
    "LLM (OpenAI)",
    "Next.js 15",
    "React 19",
    "TanStack Query · Table",
    "Tailwind CSS 4",
    "LDAP · JWT",
    "Telegram Bot API",
    "cron · systemd",
    "GitHub Actions"
  ],
  code: [
    {
      path: "src/integrations/mail/utils/fingerprint.py · dedup.py",
      language: "python",
      code: `def compute_fingerprint(*, sender: str, normalized_subject: str, normalized_body: str) -> str:
    # Поля склеиваются с префиксом длины, а не разделителем: разделитель можно подделать,
    # длина даёт однозначную кодировку при любом содержимом.
    parts = (sender.strip().casefold(), normalized_subject, normalized_body)
    payload = "".join(f"{len(part)}:{part}" for part in parts)
    return hashlib.sha256(payload.encode("utf-8", errors="surrogatepass")).hexdigest()


def decide_dedup(
    *,
    received_at: datetime,
    previous: PreviousMessage | None,
    duplicate_window: timedelta,
) -> DedupDecision:
    if previous is None:
        return DedupDecision(status=DedupStatus.NEW, duplicate_of_id=None)

    delta = abs(received_at - previous.root_received_at)
    status = DedupStatus.DUPLICATE if delta < duplicate_window else DedupStatus.REPEAT
    return DedupDecision(status=status, duplicate_of_id=previous.root_id)`
    },
    {
      path: "src/integrations/mail/services/classification.py",
      language: "python",
      code: `def should_retry_now(
    message: MailMessage,
    *,
    cfg: MailConfig,
    now: datetime,
    ai_worked_at: datetime | None = None,
) -> bool:
    """Первая попытка — сразу, дальше паузы растут: 1, 5, 10, 20, 40 минут, потом час.
    Сбой сервиса повторяется без предела; ИИ вернулся — письмо идёт сразу."""
    attempts = message.classification_attempts
    if attempts <= 0:
        return True
    service = is_service_failure(message.classification_error)
    if not service and attempts >= cfg.classification_max_attempts:
        return False

    base = message.classification_attempted_at or message.created_at or now
    if service and ai_worked_at is not None and ai_worked_at > base:
        return True
    return now >= base + retry_delay(attempts, cfg=cfg)`
    },
    {
      path: "src/services/tenders/filter_requests.py",
      language: "python",
      code: `    while True:
        _wake.clear()  # сброс — до разбора толчков: толчок посреди круга снова разбудит
        try:
            while True:
                async with open_session() as session:
                    sent = await send_next(session, client=client)  # SKIP LOCKED, своя транзакция
                    await session.commit()
                if not sent:
                    break
            changed = set(_changed_in_filter)          # номера из вебхука «Фильтра»
            _changed_in_filter.difference_update(changed)
            if changed:
                async with open_session() as session:
                    await check_answers(session, client=client, only=changed)
                    await session.commit()
            if last_check is None or loop.time() - last_check >= settings.filter_integration.poll_seconds:
                async with open_session() as session:
                    await check_answers(session, client=client)  # опрос-страховка
                    await session.commit()
                last_check = loop.time()
        except Exception:
            log.exception("[Filter] Круг отправки и опроса не удался")
        await wait(SEND_EVERY_SECONDS)`
    }
  ],
  ru: {
    title: "Тендерный паук",
    kicker: "Кейс · тендеры и почта",
    lead: "Сам собирает закупки из агрегатора и из писем площадок, ИИ раскладывает подборки на отдельные закупки, тендер ведётся по статусам до 1С — и одной кнопкой уходит с документами на оценку в Фильтр заявок.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "Что это",
        value: "Система тендерного отдела поставщика металлопроката"
      },
      {
        icon: "i-ph-envelope-simple",
        term: "Источники",
        value: "Агрегатор, письма и страницы площадок"
      },
      {
        icon: "i-ph-link",
        term: "Связка",
        value: "Фильтр заявок — оценка одной кнопкой"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Сроки",
        value: "Октябрь 2025 — ноябрь 2026, в работе"
      }
    ],
    problem: {
      before: [
        "Поток уведомлений и подборок площадок разбирали руками в общем ящике",
        "Тендеры из агрегатора и из писем жили отдельно, карточки копировали вручную",
        "О сбоях почты и ИИ узнавали от пользователей или случайно из лога"
      ],
      after: [
        "Письмо в системе через ~30 секунд, ИИ раскладывает его на закупки",
        "Одна база тендеров, дубли схлопываются, работа — очередью по одному",
        "«В фильтр» — одна кнопка, сбои в Telegram в течение минуты"
      ]
    },
    steps: [
      {
        icon: "i-ph-envelope-simple-open",
        title: "Письмо уже разобрано",
        text: "Паук сам забирает уведомление из ящика, ИИ ставит важность и раскладывает подборку на закупки."
      },
      {
        icon: "i-ph-hand-pointing",
        title: "Решение по закупке",
        text: "Письма из своей очереди — по одному: «В обработку» заводит тендер, дубли помечены."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Проверка в Фильтре",
        text: "«В фильтр» отправляет карточку с документами, в тендере появляется вердикт, балл и 👍/👎."
      },
      {
        icon: "i-ph-telegram-logo",
        title: "Согласование и 1С",
        text: "Готовый текст для чата менеджеров; ответ получен — тендер уходит в оформление в 1С."
      }
    ],
    stages: [
      {
        icon: "i-ph-download-simple",
        title: "Сбор",
        tool: "IMAP · API агрегатора · cron",
        detail:
          "Агрегатор опрашивается раз в час с курсором и повтором после сбоя, ящик — каждые 15 секунд. Справочники сотрудников и организаций приходят из 1С."
      },
      {
        icon: "i-ph-fingerprint",
        title: "Дедупликация",
        tool: "SHA-256 · PostgreSQL",
        detail:
          "Отпечаток письма отличает дубль от повтора, персональные копии рассылки склеиваются, номера закупок сверяются между почтой и агрегатором."
      },
      {
        icon: "i-ph-brain",
        title: "ИИ-разбор",
        tool: "Dify · LLM",
        detail:
          "Важность письма и закупки в JSON: номер, заказчик, ИНН, срок, позиции. Длинные подборки читаются частями внахлёст."
      },
      {
        icon: "i-ph-robot",
        title: "Обогащение",
        tool: "Playwright",
        detail:
          "Робот открывает страницу закупки на площадке, дописывает карточку теми же полями и скачивает документы к тендеру."
      },
      {
        icon: "i-ph-kanban",
        title: "Работа с тендером",
        tool: "FastAPI · Next.js",
        detail:
          "Очередь «по одному» с блокировкой открытого письма. Статусы: новые → в обработке → на согласовании → оформление в 1С или отклонено."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Фильтр и согласование",
        tool: "HTTP API · вебхук",
        detail:
          "Тендер с документами уходит на оценку в Фильтр, вердикт и решение возвращаются в карточку; для менеджеров собирается текст в Telegram."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Веб-интерфейс",
          tech: "Next.js 15 · React 19",
          text: "24 страницы: очереди почты, тендеры по статусам, карточка, дашборды, справочники."
        },
        {
          id: "bff",
          name: "Прокси",
          tech: "Next.js route handlers",
          text: "92 маршрута: прячут API от браузера, переносят токены и принимают вебхук Фильтра."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "103 эндпоинта; роль проверяется на каждом запросе."
        },
        {
          id: "sso",
          name: "Вход",
          tech: "LDAP · JWT",
          text: "Учётки Active Directory, пять ролей из групп AD, синхронизация каждые 6 часов."
        }
      ],
      data: [
        {
          id: "db",
          name: "База",
          tech: "PostgreSQL",
          text: "38 таблиц и 89 миграций; JSONB, вычисляемый номер закупки, advisory-блокировки."
        },
        {
          id: "mailbox",
          name: "Ящик",
          tech: "IMAP, только чтение",
          text: "Хранилище оригиналов: вложения не копируются, а перечитываются по UID, когда нужны."
        },
        {
          id: "files",
          name: "Документы",
          tech: "диск",
          text: "Загрузки сотрудников и скачанные документы площадок."
        }
      ],
      processing: [
        {
          id: "watcher",
          name: "Наблюдатель почты",
          tech: "systemd",
          text: "Долгоживущий процесс: приём, ИИ-разметка, синхронизация «прочитано» и робот страниц площадок."
        },
        {
          id: "jobs",
          name: "Задачи по расписанию",
          tech: "cron · flock",
          text: "Поиск в агрегаторе, подробности, импорт из 1С, классификация организаций."
        },
        {
          id: "ai",
          name: "ИИ",
          tech: "Dify · LLM",
          text: "Разметка писем и страниц, отрасль заказчика и ассистент по базе только на чтение."
        },
        {
          id: "filter",
          name: "Связка с Фильтром",
          tech: "фоновая задача",
          text: "Очередь отправки, приём вебхука и страховочный опрос состояния."
        },
        {
          id: "alerts",
          name: "Сбои",
          tech: "Telegram",
          text: "Ошибки процессов и тихие остановки — в чат мониторинга."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-lock",
        title: "Без гонок",
        summary: "Блокировки при приёме и заведении тендера",
        text: "Приём почты защищён flock и транзакционной блокировкой, курсор ящика двигается только после коммита. Тендер по номеру закупки заводится под блокировкой по хэшу номера — двое не возьмут одну закупку."
      },
      {
        icon: "i-ph-git-merge",
        title: "Одна закупка из двух каналов",
        summary: "Нормализованный номер и «кто первый — тот рабочий»",
        text: "Номер очищается от «№», пробелов и похожих кириллических букв, учитываются форматы площадок. Поздний тендер агрегатора помечается дублем письма."
      },
      {
        icon: "i-ph-brain",
        title: "Устойчивая ИИ-разметка",
        summary: "Сбой сервиса ≠ плохой ответ модели",
        text: "Разметка идёт отдельно от приёма. Сбой сервиса повторяется без предела и никогда не превращается в «не критично», плохой ответ — ограниченное число раз; длинные подборки читаются внахлёст."
      },
      {
        icon: "i-ph-globe",
        title: "Документы с чужих площадок",
        summary: "Темп, сертификаты и защита от SSRF",
        text: "Пауза к каждому хосту растёт при обрывах и 429; недостающие промежуточные сертификаты докачиваются с проверкой цепочки; редиректы — только на публичные адреса, размер — потоково не больше 100 МБ."
      },
      {
        icon: "i-ph-arrows-clockwise",
        title: "Вебхук плюс опрос",
        summary: "Толчок будит, состояние Паук берёт сам",
        text: "В толчке только номера заявок, а состояние Паук забирает сам; потерянный толчок догоняет опрос. Очередь и проверка «заявка всё ещё последняя» защищают от дублей и устаревших решений."
      },
      {
        icon: "i-ph-siren",
        title: "Мониторинг без зависимостей",
        summary: "Спул сбоев в файл и сторож тихих остановок",
        text: "Каждый процесс пишет сбой в файл без базы и сети; отправитель склеивает повторы. Сторож ловит то, что не падает с ошибкой: почта не приходит, очередь стоит, диск заполнен."
      }
    ],
    numbers: [
      {
        area: "Тесты",
        value: "1598",
        detail: "тестов бэкенда и 55 — интерфейса, CI на каждый пуш"
      },
      { area: "API", value: "103", detail: "эндпоинта и 92 маршрута прокси" },
      { area: "База", value: "38", detail: "таблиц и 89 миграций" },
      { area: "История", value: "897", detail: "коммитов в основной ветке, 2025 — 2026" }
    ],
    code: [
      {
        label: "Дубль или повтор",
        explanation:
          "Отпечаток письма склеивает поля с префиксом длины — подделать границу нельзя. По времени от первого письма решается: дубль (меньше суток) или повтор."
      },
      {
        label: "Повторы ИИ",
        explanation:
          "Сбой сервиса и непонятный ответ модели — разные вещи: первый повторяется, пока сервис не оживёт, второй — ограниченное число раз."
      },
      {
        label: "Связка с Фильтром",
        explanation:
          "Один цикл отправляет очередь заявок, разбирает номера из вебхука и раз в пару минут страхует опросом — так ни одно изменение не теряется."
      }
    ]
  },
  en: {
    title: "Tender Spider",
    kicker: "Case · tenders and mail",
    lead: "It gathers tenders from an aggregator and from marketplace e-mails by itself, AI splits digests into separate tenders, each tender moves through statuses to 1C — and one button sends it with documents to the Request Filter.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "What",
        value: "Tender desk system of a metals supplier"
      },
      {
        icon: "i-ph-envelope-simple",
        term: "Sources",
        value: "An aggregator, e-mails and tender pages"
      },
      {
        icon: "i-ph-link",
        term: "Works with",
        value: "Request Filter — one-click assessment"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Timeline",
        value: "October 2025 — November 2026, in use"
      }
    ],
    problem: {
      before: [
        "Marketplace notices and digests were sorted by hand in a shared mailbox",
        "Aggregator tenders and e-mailed ones lived apart; cards were copied by hand",
        "Mail or AI failures were noticed by users, or by chance in a log"
      ],
      after: [
        "An e-mail is in the system in ~30 seconds, AI splits it into tenders",
        "One tender base, duplicates merged, work as a one-at-a-time queue",
        "“To the Filter” is one button; failures reach Telegram within a minute"
      ]
    },
    steps: [
      {
        icon: "i-ph-envelope-simple-open",
        title: "E-mail already read",
        text: "The Spider picks the notice up from the mailbox; AI rates it and splits a digest into tenders."
      },
      {
        icon: "i-ph-hand-pointing",
        title: "Decide on a tender",
        text: "E-mails from one's own queue, one at a time: “Take” creates a tender, duplicates are marked."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Check in the Filter",
        text: "“To the Filter” sends the card with documents; the verdict, score and 👍/👎 appear in the tender."
      },
      {
        icon: "i-ph-telegram-logo",
        title: "Approval and 1C",
        text: "Ready text for the sales managers' chat; once they answer, the tender goes to 1C."
      }
    ],
    stages: [
      {
        icon: "i-ph-download-simple",
        title: "Collection",
        tool: "IMAP · aggregator API · cron",
        detail:
          "The aggregator is polled hourly with a cursor and a retry after failures, the mailbox every 15 seconds. Staff and company lists come from 1C."
      },
      {
        icon: "i-ph-fingerprint",
        title: "De-duplication",
        tool: "SHA-256 · PostgreSQL",
        detail:
          "An e-mail fingerprint tells a duplicate from a repeat, personal copies of a mailing are merged, tender numbers are matched between mail and the aggregator."
      },
      {
        icon: "i-ph-brain",
        title: "AI reading",
        tool: "Dify · LLM",
        detail:
          "Priority and tenders as JSON: number, customer, tax ID, deadline, items. Long digests are read in overlapping parts."
      },
      {
        icon: "i-ph-robot",
        title: "Enrichment",
        tool: "Playwright",
        detail:
          "A robot opens the tender's page on the marketplace, fills the card with the same fields and downloads the documents."
      },
      {
        icon: "i-ph-kanban",
        title: "Working the tender",
        tool: "FastAPI · Next.js",
        detail:
          "A one-at-a-time queue with the open e-mail locked. Statuses: new → in progress → for approval → into 1C or rejected."
      },
      {
        icon: "i-ph-funnel-simple",
        title: "Filter and approval",
        tool: "HTTP API · webhook",
        detail:
          "The tender and its documents go to the Filter for assessment; the verdict and decision come back to the card; a Telegram text is prepared for managers."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Web app",
          tech: "Next.js 15 · React 19",
          text: "24 pages: mail queues, tenders by status, the card, dashboards, reference lists."
        },
        {
          id: "bff",
          name: "Proxy",
          tech: "Next.js route handlers",
          text: "92 routes: hide the API from the browser, carry tokens and take the Filter's webhook."
        },
        {
          id: "api",
          name: "API",
          tech: "FastAPI",
          text: "103 endpoints; the role is checked on every request."
        },
        {
          id: "sso",
          name: "Sign-in",
          tech: "LDAP · JWT",
          text: "Active Directory accounts, five roles from AD groups, synced every 6 hours."
        }
      ],
      data: [
        {
          id: "db",
          name: "Database",
          tech: "PostgreSQL",
          text: "38 tables and 89 migrations; JSONB, a computed tender number, advisory locks."
        },
        {
          id: "mailbox",
          name: "Mailbox",
          tech: "IMAP, read-only",
          text: "Keeps the originals: attachments aren't copied but re-read by UID when needed."
        },
        {
          id: "files",
          name: "Documents",
          tech: "disk",
          text: "Staff uploads and documents downloaded from marketplaces."
        }
      ],
      processing: [
        {
          id: "watcher",
          name: "Mail watcher",
          tech: "systemd",
          text: "A long-running process: intake, AI tagging, read-state sync and the marketplace page robot."
        },
        {
          id: "jobs",
          name: "Scheduled jobs",
          tech: "cron · flock",
          text: "Aggregator search, details, 1C import, company classification."
        },
        {
          id: "ai",
          name: "AI",
          tech: "Dify · LLM",
          text: "Reading e-mails and pages, the customer's industry and a read-only assistant over the database."
        },
        {
          id: "filter",
          name: "Filter link",
          tech: "background task",
          text: "A send queue, the webhook intake and a safety poll of states."
        },
        {
          id: "alerts",
          name: "Failures",
          tech: "Telegram",
          text: "Process errors and silent stalls go to the monitoring chat."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-lock",
        title: "No races",
        summary: "Locks on intake and on creating a tender",
        text: "Mail intake is guarded by flock and a transactional lock; the mailbox cursor moves only after commit. A tender is created under a lock on its number's hash — two people can't take the same one."
      },
      {
        icon: "i-ph-git-merge",
        title: "One tender, two channels",
        summary: "A normalised number and “first one wins”",
        text: "The number loses “№”, spaces and look-alike Cyrillic letters, and marketplace formats are understood. A later aggregator tender is marked as a duplicate of the e-mail."
      },
      {
        icon: "i-ph-brain",
        title: "Robust AI tagging",
        summary: "A service failure ≠ a bad model answer",
        text: "Tagging runs apart from intake. A service failure is retried without limit and never becomes “not urgent”; a bad answer only a few times; long digests are read with overlap."
      },
      {
        icon: "i-ph-globe",
        title: "Documents from other sites",
        summary: "Pacing, certificates and SSRF protection",
        text: "The pause per host grows on drops and 429s; missing intermediate certificates are fetched and the chain verified; redirects only to public addresses, size streamed and capped at 100 MB."
      },
      {
        icon: "i-ph-arrows-clockwise",
        title: "Webhook plus polling",
        summary: "A push wakes it, the Spider fetches state itself",
        text: "A push carries only request numbers; the Spider fetches the state itself, and polling catches a lost push. A queue and a “still the latest request” check stop duplicates and stale decisions."
      },
      {
        icon: "i-ph-siren",
        title: "Monitoring without dependencies",
        summary: "A failure spool file and a stall watchdog",
        text: "Every process writes failures to a file — no database, no network; a sender merges repeats. A watchdog catches what doesn't crash: no mail coming in, a stuck queue, a full disk."
      }
    ],
    numbers: [
      {
        area: "Tests",
        value: "1598",
        detail: "backend tests and 55 for the UI, CI on every push"
      },
      { area: "API", value: "103", detail: "endpoints and 92 proxy routes" },
      { area: "Database", value: "38", detail: "tables and 89 migrations" },
      { area: "History", value: "897", detail: "commits on main, 2025 — 2026" }
    ],
    code: [
      {
        label: "Duplicate or repeat",
        explanation:
          "The fingerprint joins fields with a length prefix, so a boundary can't be faked. The time since the first e-mail decides: a duplicate (under a day) or a repeat."
      },
      {
        label: "AI retries",
        explanation:
          "A service failure and an unclear model answer are different: the first is retried until the service is back, the second only a few times."
      },
      {
        label: "Filter link",
        explanation:
          "One loop sends the queue, handles numbers from the webhook and every couple of minutes polls as a safety net — no change gets lost."
      }
    ]
  }
};

export default spider;
