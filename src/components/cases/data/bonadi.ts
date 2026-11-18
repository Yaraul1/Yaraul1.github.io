import type { ProjectCaseData } from "../types";

/** BONADI: the site of a women's knitwear brand on 1C-Bitrix (live, June–September 2026). */
const bonadi: ProjectCaseData = {
  id: "bonadi",
  art: "bonadi",
  firstNode: "aggregates",
  site: "https://bonadi.by/",
  stack: [
    "PHP 8.3",
    "1С-Битрикс «Старт»",
    "MySQL 8",
    "JavaScript (ES2020, без сборщика)",
    "CSS",
    "GD · WebP",
    "Telegram Bot API",
    "Docker",
    "Bash · rsync"
  ],
  code: [
    {
      path: "local/lib/Bonadi/Catalog/ClothesAggregates.php",
      language: "php",
      code: `        $variants = \\CIBlockElement::GetList(
            [],
            ['IBLOCK_ID' => $variantsIblock, 'PROPERTY_PARENT_MODEL' => $modelId, 'CHECK_PERMISSIONS' => 'N'],
            false,
            false,
            ['ID', 'PROPERTY_PRICE', 'PROPERTY_COLOR', 'PROPERTY_SIZES']
        );
        // Множественное PROPERTY_SIZES размножает строки — собираем уникальные.
        while ($variant = $variants->Fetch()) {
            if ($variant['PROPERTY_PRICE_VALUE'] !== null && $variant['PROPERTY_PRICE_VALUE'] !== '') {
                $prices[] = (float)$variant['PROPERTY_PRICE_VALUE'];
            }
            if (!empty($variant['PROPERTY_COLOR_VALUE'])) {
                $colorEnumIds[(int)$variant['PROPERTY_COLOR_ENUM_ID']] = true;
            }
            // ... сбор $sizeLabels, затем HEX по enum цвета ...
        }
        // Размеры варианта и модели — РАЗНЫЕ свойства с разными ID enum-значений,
        // поэтому маппим по названию на enum модели.
        $modelSizeIds = self::mapSizeLabelsToModelEnum(array_keys($sizeLabels), $clothesIblock);

        \\CIBlockElement::SetPropertyValuesEx($modelId, $clothesIblock, [
            'MIN_PRICE' => $prices ? min($prices) : false,
            'COLOR_HEX' => $hexes ? array_values(array_unique($hexes)) : false,
            'SIZES' => $modelSizeIds ?: false,
        ]);`
    },
    {
      path: "local/templates/bonadi/js/bonadi.js",
      language: "javascript",
      code: `    const imgRect = img.getBoundingClientRect();
    const boxW = imgRect.width;
    const boxH = imgRect.height;
    const natW = img.naturalWidth || boxW;
    const natH = img.naturalHeight || boxH;
    if (!boxW || !boxH || !natW || !natH) {
      return;
    }

    // object-fit: cover — масштаб по большей стороне, центрирование избытка.
    const scale = Math.max(boxW / natW, boxH / natH);
    const drawnW = natW * scale;
    const drawnH = natH * scale;
    const originX = (boxW - drawnW) * objectX;
    const originY = (boxH - drawnH) * objectY;

    const parent = panel.offsetParent || hero;
    const parentRect = parent.getBoundingClientRect();
    const topLeft = mapPoint(imgRect, parentRect, originX, originY, drawnW, drawnH, boxLeft, boxTop);
    const bottomRight = mapPoint(imgRect, parentRect, originX, originY, drawnW, drawnH, boxRight, boxBottom);
    const rectW = Math.abs(bottomRight.x - topLeft.x);
    const rectH = Math.abs(bottomRight.y - topLeft.y);
    panel.style.left = \`\${Math.min(topLeft.x, bottomRight.x) + rectW / 2 + boxShiftX}px\`;
    panel.style.top = \`\${Math.min(topLeft.y, bottomRight.y) + rectH / 2 + boxShiftY}px\`;`
    }
  ],
  ru: {
    title: "BONADI",
    kicker: "Кейс · сайт бренда",
    lead: "Сайт фабрики женского трикотажа: каталог моделей с цветами и размерами, заявки сразу в Telegram и админка, где модель со всеми цветами заводится за один раз.",
    facts: [
      { icon: "i-ph-t-shirt", term: "Что это", value: "Сайт-витрина бренда трикотажа" },
      {
        icon: "i-ph-stack",
        term: "Платформа",
        value: "1С-Битрикс «Старт» без модуля каталога"
      },
      { icon: "i-ph-layout", term: "Сайт", value: "8 разделов, каталог и админка" },
      {
        icon: "i-ph-calendar-blank",
        term: "Сроки",
        value: "Июнь — сентябрь 2026, работает"
      }
    ],
    problem: {
      before: [
        "В тарифе Битрикса нет модулей каталога, форм и CRM — ни вариантов товара, ни заявок",
        "Модель и каждый её цвет заводились отдельными карточками",
        "Фото приходили с телефона по 4–5 тысяч пикселей"
      ],
      after: [
        "Модель → цвета: цена «от», палитра и размеры пересчитываются сами",
        "Быстрый ввод модели со всеми цветами, заявки в админку и Telegram",
        "Фото сами сжимаются в WebP, деплой с проверками и откатом"
      ]
    },
    steps: [
      {
        icon: "i-ph-house",
        title: "Главная",
        text: "Первый экран с текстом внутри петли на фото, дальше модели, преимущества и о фабрике."
      },
      {
        icon: "i-ph-squares-four",
        title: "Каталог",
        text: "Категории, поиск, новинки и распродажа — без перезагрузки, кнопка «назад» работает."
      },
      {
        icon: "i-ph-palette",
        title: "Карточка товара",
        text: "Цвет меняет галерею; размеры, таблица размеров и ссылка на маркетплейс."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Заявка",
        text: "Вопрос о товаре, сотрудничество или контакты — заявка у менеджера в админке и в Telegram."
      }
    ],
    stages: [
      {
        icon: "i-ph-browser",
        title: "Шаблон сайта",
        tool: "PHP · JS",
        detail:
          "Страницы на PHP и вся логика интерфейса в одном модуле на чистом JavaScript, без сборщика; 18 файлов стилей."
      },
      {
        icon: "i-ph-tag",
        title: "Каталог",
        tool: "инфоблоки",
        detail:
          "Две связанные сущности — модели и цветовые варианты. На событиях Битрикса пересчитываются цена «от», цвета и размеры модели."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Заявки",
        tool: "OnProlog → Telegram",
        detail:
          "Отправка формы перехватывается до штатного редиректа: проверки и антиспам, запись в инфоблок заявок и уведомление в Telegram."
      },
      {
        icon: "i-ph-sliders",
        title: "Админка",
        tool: "Битрикс + свои страницы",
        detail:
          "Раздел BONADI: быстрый ввод модели со всеми цветами и фото, рабочий стол, справочники и защита от потери несохранённых правок."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Эксплуатация",
        tool: "rsync · cron",
        detail:
          "Деплой из Git со smoke-тестами, проверкой здоровья и откатом; логи с request-id и ночная очистка временных фото."
      }
    ],
    architecture: {
      request: [
        {
          id: "site",
          name: "Сайт",
          tech: "PHP + JS",
          text: "Публичные страницы и каталог, который обновляется без перезагрузки."
        },
        {
          id: "forms",
          name: "Формы",
          tech: "PHP",
          text: "Вопрос о товаре, сотрудничество и контакты."
        },
        {
          id: "admin",
          name: "Админка",
          tech: "Битрикс + BONADI",
          text: "Четыре свои страницы и четыре AJAX-метода для ввода ассортимента."
        }
      ],
      data: [
        {
          id: "mysql",
          name: "Каталог и заявки",
          tech: "MySQL 8 · инфоблоки",
          text: "Модели, цвета и варианты, заявки и справочники."
        },
        {
          id: "photos",
          name: "Фото",
          tech: "WebP",
          text: "Все фото приводятся к WebP до 2000 px."
        },
        {
          id: "logs",
          name: "Логи",
          tech: "JSONL",
          text: "Сквозной request-id и журнал событий."
        }
      ],
      processing: [
        {
          id: "aggregates",
          name: "Пересчёт модели",
          tech: "PHP",
          text: "Обработчики событий собирают цену «от», палитру и размеры модели из её вариантов."
        },
        {
          id: "leads",
          name: "Приём заявок",
          tech: "PHP",
          text: "Проверка сессии, ловушка для ботов, согласие на обработку данных и лимит частоты."
        },
        {
          id: "webp",
          name: "Фото",
          tech: "GD",
          text: "Сжатие в WebP, качество 85, до 2000 px по большей стороне."
        },
        {
          id: "telegram",
          name: "Уведомления",
          tech: "Telegram Bot API",
          text: "Каждая заявка приходит менеджеру в Telegram."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-tag",
        title: "Варианты без модуля каталога",
        summary: "Модель и её цвета — две связанные сущности",
        text: "Цена «от», цвета и размеры модели пересчитываются на событиях добавления, изменения и удаления. При удалении родитель запоминается до события, а пересчёт идёт после."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Заявки без форм и CRM",
        summary: "Перехват отправки до штатного редиректа",
        text: "Проверки: сессия, скрытое поле-ловушка для ботов, согласие и не чаще раза в 8 секунд. Для Telegram сделано своё событие, чтобы уведомление не мешало сохранению."
      },
      {
        icon: "i-ph-image",
        title: "Чистка фото без потерь",
        summary: "Удаляется только то, на что никто не ссылается",
        text: "Битрикс хранит одинаковые файлы один раз, поэтому живые фото остаются во временной папке. Очистка удаляет файлы старше 48 часов и только без ссылок из галерей и превью."
      },
      {
        icon: "i-ph-squares-four",
        title: "Каталог без перезагрузок",
        summary: "AJAX, история браузера и стабильная вёрстка",
        text: "Сетка и фильтры меняются без перезагрузки, «назад» работает, высота фиксируется против скачков. Поиск идёт через свой параметр: стандартный переводил каталог в режим, где страница падала."
      },
      {
        icon: "i-ph-text-aa",
        title: "Текст в петле на фото",
        summary: "Пересчёт геометрии object-fit: cover",
        text: "Панель с текстом ставится в экранные координаты петли на фотографии при любом размере окна, масштабе и на телефоне; есть спокойный вариант анимации."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Деплой с откатом",
        summary: "Smoke-тесты, проверка здоровья, возврат версии",
        text: "Скрипт деплоя гоняет 67 проверок и проверяет живой сайт; при ошибке откатывается на прошлый коммит. Обёртка лежит вне репозитория, чтобы не перезаписать саму себя."
      }
    ],
    numbers: [
      {
        area: "Код",
        value: "≈24k",
        detail: "строк своего PHP, JS и CSS без ядра Битрикса"
      },
      {
        area: "Проверки",
        value: "67",
        detail: "smoke-тестов в 12 группах, в том числе при деплое"
      },
      {
        area: "История",
        value: "42",
        detail: "коммита, июнь — сентябрь 2026, два автора"
      },
      { area: "Сайт", value: "8", detail: "разделов, плюс 4 страницы своей админки" }
    ],
    code: [
      {
        label: "Пересчёт модели",
        explanation:
          "Цена «от», палитра и размеры модели собираются из её цветовых вариантов. Размеры у модели и варианта — разные списки, поэтому сопоставляются по названию."
      },
      {
        label: "Текст в петле",
        explanation:
          "Повторяет расчёт object-fit: cover, чтобы найти, где на экране оказалась петля на фото, и поставить туда панель с текстом."
      }
    ]
  },
  en: {
    title: "BONADI",
    kicker: "Case · brand website",
    lead: "The site of a women's knitwear factory: a catalogue of models with colours and sizes, enquiries straight to Telegram, and an admin where a model with all its colours is added in one go.",
    facts: [
      { icon: "i-ph-t-shirt", term: "What", value: "Showcase site of a knitwear brand" },
      {
        icon: "i-ph-stack",
        term: "Platform",
        value: "1C-Bitrix “Start”, no catalogue module"
      },
      {
        icon: "i-ph-layout",
        term: "Site",
        value: "8 sections, a catalogue and an admin"
      },
      {
        icon: "i-ph-calendar-blank",
        term: "Timeline",
        value: "June — September 2026, live"
      }
    ],
    problem: {
      before: [
        "The Bitrix plan has no catalogue, forms or CRM modules — no product variants, no enquiries",
        "A model and each of its colours had to be entered as separate items",
        "Photos arrived straight from phones, 4–5 thousand pixels wide"
      ],
      after: [
        "Model → colours: the starting price, palette and sizes update themselves",
        "Quick entry of a model with all colours; enquiries in the admin and Telegram",
        "Photos turn into WebP on upload; deploys with checks and rollback"
      ]
    },
    steps: [
      {
        icon: "i-ph-house",
        title: "Home",
        text: "A first screen with text set inside a knitted loop on the photo, then models, benefits and the factory."
      },
      {
        icon: "i-ph-squares-four",
        title: "Catalogue",
        text: "Categories, search, new and sale items — without reloads, and the back button works."
      },
      {
        icon: "i-ph-palette",
        title: "Product page",
        text: "A colour switches the gallery; sizes, a size chart and a marketplace link."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Enquiry",
        text: "A product question, partnership or contact — it lands in the admin and in Telegram."
      }
    ],
    stages: [
      {
        icon: "i-ph-browser",
        title: "Site template",
        tool: "PHP · JS",
        detail:
          "Pages in PHP and all interface logic in one plain JavaScript module, no bundler; 18 stylesheets."
      },
      {
        icon: "i-ph-tag",
        title: "Catalogue",
        tool: "info blocks",
        detail:
          "Two linked entities — models and colour variants. Bitrix events recalculate a model's starting price, colours and sizes."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Enquiries",
        tool: "OnProlog → Telegram",
        detail:
          "The form post is caught before Bitrix redirects: checks and anti-spam, a record in the enquiries block and a Telegram message."
      },
      {
        icon: "i-ph-sliders",
        title: "Admin",
        tool: "Bitrix + own pages",
        detail:
          "A BONADI section: quick entry of a model with all colours and photos, a dashboard, reference lists and a guard against losing unsaved edits."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Operations",
        tool: "rsync · cron",
        detail:
          "Deploys from Git with smoke tests, a health check and rollback; logs with a request id and a nightly clean-up of temporary photos."
      }
    ],
    architecture: {
      request: [
        {
          id: "site",
          name: "Site",
          tech: "PHP + JS",
          text: "Public pages and a catalogue that updates without reloading."
        },
        {
          id: "forms",
          name: "Forms",
          tech: "PHP",
          text: "Product questions, partnership and contacts."
        },
        {
          id: "admin",
          name: "Admin",
          tech: "Bitrix + BONADI",
          text: "Four custom pages and four AJAX methods for entering the range."
        }
      ],
      data: [
        {
          id: "mysql",
          name: "Catalogue & enquiries",
          tech: "MySQL 8 · info blocks",
          text: "Models, colours and variants, enquiries and reference lists."
        },
        {
          id: "photos",
          name: "Photos",
          tech: "WebP",
          text: "Every photo is brought to WebP, up to 2000 px."
        },
        {
          id: "logs",
          name: "Logs",
          tech: "JSONL",
          text: "A request id end to end, plus an event log."
        }
      ],
      processing: [
        {
          id: "aggregates",
          name: "Model totals",
          tech: "PHP",
          text: "Event handlers build a model's starting price, palette and sizes from its variants."
        },
        {
          id: "leads",
          name: "Enquiry intake",
          tech: "PHP",
          text: "Session check, a honeypot for bots, consent to data processing and a rate limit."
        },
        {
          id: "webp",
          name: "Photos",
          tech: "GD",
          text: "WebP at quality 85, up to 2000 px on the long side."
        },
        {
          id: "telegram",
          name: "Notifications",
          tech: "Telegram Bot API",
          text: "Every enquiry reaches the manager in Telegram."
        }
      ]
    },
    decisions: [
      {
        icon: "i-ph-tag",
        title: "Variants without a catalogue",
        summary: "A model and its colours as two linked entities",
        text: "A model's starting price, colours and sizes are recalculated on add, update and delete. On delete the parent is remembered before the event and recalculated after it."
      },
      {
        icon: "i-ph-chat-circle-text",
        title: "Enquiries without forms or CRM",
        summary: "Catching the post before Bitrix redirects",
        text: "Checks: session, a hidden honeypot field, consent and at most one post every 8 seconds. Telegram gets its own event, so a slow message never blocks saving."
      },
      {
        icon: "i-ph-image",
        title: "Safe photo clean-up",
        summary: "Only files nothing points to are removed",
        text: "Bitrix stores identical files once, so live photos stay in the temporary folder. The clean-up removes files older than 48 hours and only those no gallery or preview refers to."
      },
      {
        icon: "i-ph-squares-four",
        title: "A catalogue without reloads",
        summary: "AJAX, browser history and stable layout",
        text: "The grid and filters change in place, back works and the height is held against jumps. Search uses its own parameter: the standard one switched the catalogue into a mode where the page crashed."
      },
      {
        icon: "i-ph-text-aa",
        title: "Text inside the loop",
        summary: "Recomputing object-fit: cover",
        text: "The text panel is placed at the loop's screen position on the photo at any window size, zoom level and on phones; there is a calm motion variant."
      },
      {
        icon: "i-ph-rocket-launch",
        title: "Deploys with rollback",
        summary: "Smoke tests, health check, version restore",
        text: "The deploy script runs 67 checks and probes the live site; on failure it rolls back to the previous commit. Its wrapper lives outside the repo so it never overwrites itself."
      }
    ],
    numbers: [
      {
        area: "Code",
        value: "≈24k",
        detail: "lines of own PHP, JS and CSS, without the Bitrix core"
      },
      {
        area: "Checks",
        value: "67",
        detail: "smoke tests in 12 groups, run on every deploy"
      },
      {
        area: "History",
        value: "42",
        detail: "commits, June — September 2026, two authors"
      },
      { area: "Site", value: "8", detail: "sections, plus 4 custom admin pages" }
    ],
    code: [
      {
        label: "Model totals",
        explanation:
          "A model's starting price, palette and sizes are gathered from its colour variants. Model and variant sizes are different lists, so they are matched by label."
      },
      {
        label: "Text in the loop",
        explanation:
          "Repeats the object-fit: cover maths to find where the loop on the photo ended up on screen, and puts the text panel there."
      }
    ]
  }
};

export default bonadi;
