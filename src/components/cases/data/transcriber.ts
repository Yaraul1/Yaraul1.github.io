import type { ProjectCaseData } from "../types";

/** Call transcription service for a corporate portal (an MVP, October 2026). */
const transcriber: ProjectCaseData = {
  id: "transcriber",
  art: "transcriber",
  firstNode: "worker",
  stack: [
    "TypeScript",
    "Node.js 22",
    "NestJS 11",
    "Prisma",
    "PostgreSQL 17",
    "React 19",
    "Vite",
    "Keycloak (OIDC)",
    "OpenAI gpt-4o-mini-transcribe",
    "Deepgram Nova-3",
    "Dify",
    "Docker Compose",
    "Nginx",
    "Jest · Vitest"
  ],
  code: [
    {
      path: "apps/api/src/worker-main.ts",
      language: "typescript",
      code: `const backoffMs = (attempt: number): number =>
  Math.min(60_000 * 2 ** Math.max(0, attempt - 1), 60 * 60_000);
// ...
    if (!candidate) return false;
    const callbackOnly =
      candidate.status === TranscriptionStatus.CALLBACK_PENDING ||
      (candidate.status === TranscriptionStatus.PROCESSING &&
        Boolean(candidate.callbackUrl && candidate.completedAt));
    const claimed = await prisma.transcriptionJob.updateMany({
      where: {
        id: candidate.id,
        OR: [/* the same "ready" conditions as when picking the candidate */],
      },
      data: {
        status: TranscriptionStatus.PROCESSING,
        leaseExpiresAt: new Date(Date.now() + leaseMs),
        ...(callbackOnly
          ? {}
          : { attempts: { increment: 1 }, startedAt: candidate.startedAt || now }),
      },
    });
    if (!claimed.count) return false;
    const current = await prisma.transcriptionJob.findUnique({ where: { id: candidate.id } });
    if (current) await runJob(current, callbackOnly);
    return true;`
    },
    {
      path: "apps/api/src/transcriptions/transcription.engine.ts",
      language: "typescript",
      code: `  async transcribe(audio: AudioInput): Promise<TranscriptionResult> {
    const provider = this.config.get('TRANSCRIPTION_PROVIDER', 'mock').toLowerCase();
    if (provider === 'mock') {
      if (this.isProduction()) {
        throw new ServiceUnavailableException('Провайдер mock запрещён в production');
      }
      return { text: \`[DEMO] Тестовая расшифровка файла \${audio.filename}\`, provider: 'mock' };
    }
    if (provider === 'dify') return this.dify(audio);
    if (provider === 'openai') return this.openai(audio);
    if (provider === 'deepgram') return this.deepgram(audio);
    throw new ServiceUnavailableException(\`Неизвестный провайдер: \${provider}\`);
  }`
    }
  ],
  ru: {
    title: "Транскрибатор звонков",
    kicker: "Кейс · расшифровка речи",
    lead: "Записи звонков приходят файлом или ссылкой, расшифровываются в фоне, а готовый текст сам возвращается в корпоративный портал.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "Что это",
        value: "Сервис расшифровки звонков для портала"
      },
      {
        icon: "i-ph-waveform",
        term: "На входе",
        value: "Аудио до 30 МБ: файл или ссылка"
      },
      {
        icon: "i-ph-swap",
        term: "Движок",
        value: "OpenAI, Deepgram или Dify — на выбор"
      },
      { icon: "i-ph-flag", term: "Статус", value: "MVP, октябрь 2026" }
    ],
    problem: {
      before: [
        "Каждой системе с записями пришлось бы самой подключать распознавание речи",
        "Не было одного места, где видно статус расшифровки и можно её повторить",
        "Движок нельзя сменить без переделки интеграции"
      ],
      after: [
        "Один API: задача в очередь, текст сам уходит обратно в портал",
        "Повторы с задержкой, отдельная доставка результата и журнал действий",
        "Движок меняется одной настройкой, кабинет с поиском и статусами"
      ]
    },
    steps: [
      {
        icon: "i-ph-key",
        title: "Вход через SSO",
        text: "Корпоративная учётка через Keycloak, права даёт роль: пользователь, наблюдатель или админ."
      },
      {
        icon: "i-ph-upload-simple",
        title: "Новая расшифровка",
        text: "Файл до 30 МБ или ссылка, язык (ru, en, kk, be) и при желании адрес для ответа."
      },
      {
        icon: "i-ph-list-checks",
        title: "Статус",
        text: "Таблица и сводка обновляются каждые 5 секунд, статусы подписаны словом и цветом."
      },
      {
        icon: "i-ph-text-align-left",
        title: "Результат",
        text: "Текст и история этапов в боковой панели; в портал он уходит сам."
      }
    ],
    stages: [
      {
        icon: "i-ph-tray-arrow-down",
        title: "Приём",
        tool: "NestJS",
        detail:
          "Проверяет данные и разрешённые адреса ссылок, кладёт файл на диск, ставит задачу в очередь и сразу отвечает 202 — клиент не ждёт расшифровки."
      },
      {
        icon: "i-ph-queue",
        title: "Очередь",
        tool: "PostgreSQL · Prisma",
        detail:
          "Воркер забирает задачу с временной блокировкой. Если он упал, блокировка истекает и задачу подхватывает другой."
      },
      {
        icon: "i-ph-shield-check",
        title: "Скачивание",
        tool: "fetch",
        detail:
          "Запись по ссылке скачивается только с разрешённых хостов; каждое перенаправление и размер проверяются по ходу чтения."
      },
      {
        icon: "i-ph-waveform",
        title: "Распознавание",
        tool: "OpenAI · Deepgram · Dify",
        detail:
          "Один метод transcribe() для всех движков; ключи только на сервере, движок выбирается настройкой."
      },
      {
        icon: "i-ph-paper-plane-tilt",
        title: "Доставка в портал",
        tool: "HTTP callback",
        detail:
          "Готовый текст уходит в портал отдельным шагом с повторами от минуты до часа — если портал недоступен, звонок не распознаётся заново."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Кабинет",
          tech: "React 19 + Nginx",
          text: "Таблица задач, сводка, окно новой расшифровки и боковая панель с результатом."
        },
        {
          id: "api",
          name: "API",
          tech: "NestJS 11",
          text: "REST /api/v1 со Swagger, проверками готовности и единым форматом ответа."
        },
        {
          id: "sso",
          name: "Вход",
          tech: "Keycloak · OIDC",
          text: "Корпоративный вход с PKCE; в продакшене других способов нет, даже если настройка ошибочна."
        }
      ],
      data: [
        {
          id: "db",
          name: "База",
          tech: "PostgreSQL 17",
          text: "Задачи с шестью статусами и журнал действий; она же — очередь."
        },
        {
          id: "files",
          name: "Файлы",
          tech: "общий том",
          text: "Временные записи; после успешной расшифровки удаляются."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Воркер",
          tech: "Node.js",
          text: "Забирает задачи, скачивает аудио, вызывает движок и доставляет текст в портал."
        },
        {
          id: "engine",
          name: "Распознавание",
          tech: "OpenAI · Deepgram · Dify",
          text: "Внешний движок за общим интерфейсом; для демо есть заглушка, в продакшене она запрещена."
        },
        {
          id: "portal",
          name: "Портал",
          tech: "callback",
          text: "Получает готовый текст POST-запросом в общем формате ответа."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-queue",
        title: "Очередь без брокера",
        summary: "Атомарный захват задачи в PostgreSQL",
        text: "Условный updateMany забирает задачу ровно одним воркером, а срок блокировки возвращает в очередь задачи упавшего воркера. Отдельный брокер сообщений не понадобился."
      },
      {
        icon: "i-ph-shield-check",
        title: "Защита ссылок",
        summary: "Только разрешённые хосты, каждый редирект заново",
        text: "Пользователь даёт ссылку на запись и адрес для ответа. Принимаются только HTTP(S) на заданных хостах без логина в адресе; размер проверяется и по заголовку, и при чтении потока."
      },
      {
        icon: "i-ph-paper-plane-tilt",
        title: "Текст отдельно от доставки",
        summary: "Портал недоступен — расшифровка не теряется",
        text: "У доставки свои статусы и повторы с задержкой от минуты до часа. Администратор может повторить только отправку, не распознавая звонок заново."
      },
      {
        icon: "i-ph-swap",
        title: "Сменный движок",
        summary: "Провайдер — одна переменная окружения",
        text: "Движки ещё сравниваются на реальных записях, поэтому выбор вынесен в настройку. Заглушка для демо в продакшене запрещена, и проверка готовности это учитывает."
      },
      {
        icon: "i-ph-copy",
        title: "Без дублей",
        summary: "Повторная отправка звонка — ответ 409",
        text: "Уникальный ключ «сервис + внешний ID» в базе не даёт поставить один звонок дважды: вместо новой задачи клиент получает 409."
      },
      {
        icon: "i-ph-eye-slash",
        title: "Журнал без лишнего",
        summary: "Ни ссылки на запись, ни текста",
        text: "Журнал действий хранит, кто и что сделал, но не содержимое разговоров. Каждый ответ API несёт request-id, чтобы найти запрос в логах."
      }
    ],
    numbers: [
      { area: "API", value: "6", detail: "эндпоинтов, плюс health, ready и Swagger" },
      {
        area: "Тесты",
        value: "15",
        detail: "unit, e2e на Supertest и интеграция с PostgreSQL"
      },
      {
        area: "Код",
        value: "≈2,8k",
        detail: "строк TypeScript в API, воркере и кабинете"
      },
      { area: "Запуск", value: "5", detail: "сервисов в Docker Compose" }
    ],
    code: [
      {
        label: "Захват задачи",
        explanation:
          "Воркер забирает задачу одним условным UPDATE: если её уже взял другой, обновится ноль строк. Повтор только доставки не тратит попытку распознавания."
      },
      {
        label: "Сменный движок",
        explanation:
          "Все движки за одним методом. Заглушка удобна для демо, но в продакшене выбрасывает ошибку, чтобы её нельзя было оставить по ошибке."
      }
    ]
  },
  en: {
    title: "Call Transcriber",
    kicker: "Case · speech to text",
    lead: "Call recordings come in as a file or a link, get transcribed in the background, and the text goes back to the company portal on its own.",
    facts: [
      {
        icon: "i-ph-briefcase",
        term: "What",
        value: "Call transcription service for a portal"
      },
      {
        icon: "i-ph-waveform",
        term: "Input",
        value: "Audio up to 30 MB: a file or a link"
      },
      {
        icon: "i-ph-swap",
        term: "Engine",
        value: "OpenAI, Deepgram or Dify — switchable"
      },
      { icon: "i-ph-flag", term: "Status", value: "MVP, October 2026" }
    ],
    problem: {
      before: [
        "Every system storing recordings would have to wire up speech recognition itself",
        "No single place to see a transcription's status or retry it",
        "Switching the engine meant rewriting the integration"
      ],
      after: [
        "One API: a job goes into a queue, the text returns to the portal by itself",
        "Retries with backoff, separate delivery of results and an audit log",
        "The engine is one setting; a dashboard with search and statuses"
      ]
    },
    steps: [
      {
        icon: "i-ph-key",
        title: "Sign in with SSO",
        text: "A company account via Keycloak; a role grants access: user, viewer or admin."
      },
      {
        icon: "i-ph-upload-simple",
        title: "New transcription",
        text: "A file up to 30 MB or a link, the language (ru, en, kk, be) and, optionally, a reply address."
      },
      {
        icon: "i-ph-list-checks",
        title: "Status",
        text: "The table and summary refresh every 5 seconds; statuses carry both a word and a colour."
      },
      {
        icon: "i-ph-text-align-left",
        title: "Result",
        text: "The text and the job's history in a side panel; it is sent to the portal automatically."
      }
    ],
    stages: [
      {
        icon: "i-ph-tray-arrow-down",
        title: "Intake",
        tool: "NestJS",
        detail:
          "Validates the input and allowed link hosts, stores the file, queues the job and replies 202 at once — the client doesn't wait."
      },
      {
        icon: "i-ph-queue",
        title: "Queue",
        tool: "PostgreSQL · Prisma",
        detail:
          "A worker claims a job with a lease. If the worker dies, the lease expires and another one picks the job up."
      },
      {
        icon: "i-ph-shield-check",
        title: "Download",
        tool: "fetch",
        detail:
          "Linked recordings are fetched from allowed hosts only; every redirect and the size are checked while streaming."
      },
      {
        icon: "i-ph-waveform",
        title: "Recognition",
        tool: "OpenAI · Deepgram · Dify",
        detail:
          "One transcribe() method for every engine; keys stay on the server, the engine is a setting."
      },
      {
        icon: "i-ph-paper-plane-tilt",
        title: "Delivery",
        tool: "HTTP callback",
        detail:
          "The text goes to the portal as a separate step, retried from a minute to an hour — if the portal is down, the call isn't transcribed again."
      }
    ],
    architecture: {
      request: [
        {
          id: "web",
          name: "Dashboard",
          tech: "React 19 + Nginx",
          text: "Job table, summary, a new-transcription dialog and a side panel with the result."
        },
        {
          id: "api",
          name: "API",
          tech: "NestJS 11",
          text: "REST /api/v1 with Swagger, readiness checks and one response format."
        },
        {
          id: "sso",
          name: "Sign-in",
          tech: "Keycloak · OIDC",
          text: "Company sign-in with PKCE; in production there is no other way in, even if misconfigured."
        }
      ],
      data: [
        {
          id: "db",
          name: "Database",
          tech: "PostgreSQL 17",
          text: "Jobs with six statuses and the audit log; it is also the queue."
        },
        {
          id: "files",
          name: "Files",
          tech: "shared volume",
          text: "Temporary recordings, deleted after a successful transcription."
        }
      ],
      processing: [
        {
          id: "worker",
          name: "Worker",
          tech: "Node.js",
          text: "Claims jobs, downloads audio, calls the engine and delivers the text to the portal."
        },
        {
          id: "engine",
          name: "Recognition",
          tech: "OpenAI · Deepgram · Dify",
          text: "An external engine behind one interface; a stub exists for demos and is banned in production."
        },
        {
          id: "portal",
          name: "Portal",
          tech: "callback",
          text: "Receives the text as a POST in the shared response format."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-queue",
        title: "A queue without a broker",
        summary: "Atomic job claim in PostgreSQL",
        text: "A conditional updateMany hands a job to exactly one worker, and the lease returns a dead worker's jobs to the queue. No message broker was needed."
      },
      {
        icon: "i-ph-shield-check",
        title: "Safe links",
        summary: "Allowed hosts only, every redirect re-checked",
        text: "Users pass a recording link and a reply address. Only HTTP(S) to listed hosts without credentials in the URL is accepted; size is checked both in the header and while streaming."
      },
      {
        icon: "i-ph-paper-plane-tilt",
        title: "Text apart from delivery",
        summary: "Portal down — the transcript isn't lost",
        text: "Delivery has its own statuses and retries from a minute to an hour. An admin can retry just the delivery without transcribing the call again."
      },
      {
        icon: "i-ph-swap",
        title: "Switchable engine",
        summary: "The provider is one environment variable",
        text: "Engines are still being compared on real calls, so the choice is a setting. The demo stub is banned in production, and the readiness check knows it."
      },
      {
        icon: "i-ph-copy",
        title: "No duplicates",
        summary: "Sending a call twice returns 409",
        text: "A unique “service + external ID” key in the database stops the same call from being queued twice: the client gets 409 instead of a new job."
      },
      {
        icon: "i-ph-eye-slash",
        title: "A lean audit log",
        summary: "No recording links, no text",
        text: "The audit log records who did what, not what was said. Every API response carries a request id to find it in the logs."
      }
    ],
    numbers: [
      { area: "API", value: "6", detail: "endpoints, plus health, ready and Swagger" },
      {
        area: "Tests",
        value: "15",
        detail: "unit, e2e with Supertest and PostgreSQL integration"
      },
      {
        area: "Code",
        value: "≈2.8k",
        detail: "lines of TypeScript across API, worker and dashboard"
      },
      { area: "Runtime", value: "5", detail: "services in Docker Compose" }
    ],
    code: [
      {
        label: "Claiming a job",
        explanation:
          "A worker claims a job with one conditional UPDATE: if another got it first, zero rows change. Retrying only the delivery doesn't use up a recognition attempt."
      },
      {
        label: "Switchable engine",
        explanation:
          "Every engine sits behind one method. The stub is handy for demos but throws in production, so it can't be left on by mistake."
      }
    ]
  }
};

export default transcriber;
