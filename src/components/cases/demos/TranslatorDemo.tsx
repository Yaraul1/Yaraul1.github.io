import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLang } from "~/i18n/useLang";
import type { Lang } from "~/i18n/lang";
import "~/styles/demos/translator.css";

/*
  Document Translator, redrawn: the home screen (upload + the journal of finished
  documents with the stage line of a running job) and the document window (translation,
  side-by-side comparison with the original, the sheet editor and its list of edits).
  Everything is made up; the "server" is a set of timers.
*/

type Target = "ru" | "en";
type Role =
  | "co"
  | "no"
  | "h1"
  | "h2"
  | "t2"
  | "lb"
  | "v"
  | "sec"
  | "th"
  | "td"
  | "tc"
  | "p"
  | "ft"
  | "fr";
type Align = "left" | "center" | "right";
type Phase = "empty" | "attached" | "uploading" | "processing" | "done" | "cancelled";
type Mode = "view" | "edit" | "compare" | "review";
type Side = "source" | "result";
type Kind = "TEXT_EDIT" | "TEXT_DELETE" | "TEXT_RESTYLED" | "REGION_ERASE";
type ToastKind = "loading" | "success" | "info";

interface Look {
  text: string;
  size: number;
  align: Align;
  deleted: boolean;
}
interface Rect {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Layer {
  units: Record<string, Partial<Look>>;
  erased: Rect[];
}
interface Change {
  id: string;
  kind: Kind;
  page: number;
  source: string;
  before: string;
  after: string;
  size?: [number, number];
  align?: Align;
  unitId?: string;
  rectId?: string;
}
interface Entry {
  id: string;
  at: Date;
  page: number;
  changes: Change[];
}
type Block =
  | { k: "head" | "title" | "foot"; ids: string[] }
  | { k: "sec" | "p"; id: string }
  | { k: "grid"; cols: string; rows: string[][]; th?: boolean }
  | { k: "sign"; cells: string[][]; stamp: "big" | "small" };

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter(Boolean)
    .map((name) => `dm-translator-${name}`)
    .join(" ");
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const EMPTY: Layer = { units: {}, erased: [] };
const FILE = "质量证明书_DEMO-001.pdf";
const PAGE_COUNT = 2;

/* ── the sample document: id | role | page | original | Russian | English ── */
const SHEET = `
a1co|co|1|演示阀门制造有限公司|Демо-завод запорной арматуры|Demo Valve Works
a1no|no|1|证书编号：DEMO-001|Сертификат № DEMO-001|Certificate No. DEMO-001
a1h1|h1|1|质量证明书|Сертификат качества|Quality Certificate
a1h2|h2|1|（产品合格证）|(паспорт изделия)|(product passport)
i1l|lb|1|产品名称|Изделие|Product
i1v|v|1|截止阀 DN50|Клапан запорный DN50|Shut-off valve DN50
i2l|lb|1|型号规格|Обозначение|Model
i3l|lb|1|数量|Количество|Quantity
i3v|v|1|12 件|12 шт.|12 pcs
i4l|lb|1|批号|Номер партии|Batch No.
i5l|lb|1|生产日期|Дата изготовления|Manufactured
i5v|v|1|2026年11月02日|02.11.2026|2 Nov 2026
i6l|lb|1|检验日期|Дата контроля|Inspected
i6v|v|1|2026年11月05日|05.11.2026|5 Nov 2026
s1|sec|1|检验结果|Результаты контроля|Inspection results
hn|th|1|序号|№|No.
hi|th|1|检验项目|Показатель|Check
hr|th|1|技术要求|Требование|Requirement
hm|th|1|实测结果|Результат|Result
hv|th|1|结论|Вывод|Verdict
r1i|td|1|外观检查|Внешний осмотр|Visual check
r1r|td|1|无裂纹、无砂眼|Без трещин и раковин|No cracks or pores
r1m|td|1|符合|Соответствует|Complies
r1v|tc|1|合格|Годен|Pass
r2i|td|1|壳体强度试验|Прочность корпуса|Body strength
r2r|td|1|2.4 MPa，保压 3 min|2,4 МПа, выдержка 3 мин|2.4 MPa, held 3 min
r2m|td|1|无渗漏|Протечек нет|No leakage
r2v|tc|1|合格|Годен|Pass
r3i|td|1|密封试验|Герметичность затвора|Seat tightness
r3r|td|1|1.76 MPa，无泄漏|1,76 МПа, без утечек|1.76 MPa, no leaks
r3m|td|1|符合|Соответствует|Complies
r3v|tc|1|合格|Годен|Pass
r4i|td|1|启闭检查|Ход затвора|Open/close check
r4r|td|1|启闭灵活，无卡阻|Плавный, без заеданий|Smooth, no sticking
r4m|td|1|符合|Соответствует|Complies
r4v|tc|1|合格|Годен|Pass
cc|p|1|结论：本批产品经检验，符合技术要求，准予出厂。|Заключение: партия проверена, соответствует техническим требованиям и допущена к отгрузке.|Conclusion: the batch has been inspected, meets the technical requirements and is released for shipment.
g1|lb|1|检验员：|Контролёр:|Inspector:
g2|lb|1|审核：|Проверил:|Approved:
g3|lb|1|日期：|Дата:|Date:
g3v|v|1|2026-11-05|05.11.2026|5 Nov 2026
f1|ft|1|本文件仅用于演示，不作为正式凭证。|Документ создан для демонстрации и не является официальным.|Created for demonstration only; not an official document.
f1p|fr|1|第 1 页 共 2 页|Стр. 1 из 2|Page 1 of 2
b2co|co|2|演示阀门制造有限公司|Демо-завод запорной арматуры|Demo Valve Works
b2no|no|2|证书编号：DEMO-001|Сертификат № DEMO-001|Certificate No. DEMO-001
b2h1|t2|2|主要技术参数|Основные технические характеристики|Main specifications
k1p|td|2|公称通径|Номинальный диаметр|Nominal size
k2p|td|2|公称压力|Номинальное давление|Nominal pressure
k3p|td|2|工作温度|Рабочая температура|Operating temperature
k3v|td|2|−20 ℃ ～ +120 ℃|от −20 до +120 °C|−20 to +120 °C
k4p|td|2|适用介质|Рабочая среда|Medium
k4v|td|2|水、油品|Вода, масло|Water, oil
k5p|td|2|连接方式|Присоединение|Connection
k5v|td|2|法兰连接|Фланцевое|Flanged
k6p|td|2|壳体材料|Материал корпуса|Body material
k6v|td|2|球墨铸铁|Высокопрочный чугун|Ductile iron
s2|sec|2|成套性|Комплектность|Scope of supply
kh1|th|2|名称|Наименование|Item
kh2|th|2|数量|Кол-во|Qty
m1n|td|2|截止阀|Клапан запорный|Shut-off valve
m1q|tc|2|1 件|1 шт.|1 pc
m2n|td|2|产品合格证|Паспорт изделия|Product passport
m2q|tc|2|1 份|1 экз.|1 copy
m3n|td|2|使用说明书|Руководство по эксплуатации|Operating manual
m3q|tc|2|1 份|1 экз.|1 copy
s3|sec|2|质量保证|Гарантии изготовителя|Warranty
w1|p|2|自发货之日起保修 18 个月，保修期内因制造缺陷造成的损坏免费修理。|Гарантийный срок — 18 месяцев со дня отгрузки. Дефекты изготовления в этот срок устраняются бесплатно.|Warranty: 18 months from shipment. Manufacturing defects within this period are repaired free of charge.
g4|lb|2|质检部：|Отдел технического контроля:|Quality control:
f2|ft|2|本文件仅用于演示，不作为正式凭证。|Документ создан для демонстрации и не является официальным.|Created for demonstration only; not an official document.
f2p|fr|2|第 2 页 共 2 页|Стр. 2 из 2|Page 2 of 2`;

const UNITS: Record<string, [Role, number, string, string, string]> = Object.fromEntries(
  SHEET.trim()
    .split("\n")
    .map((line) => {
      const [id, role, page, zh, ru, en] = line.split("|");
      return [id, [role as Role, Number(page), zh, ru, en]];
    })
);

/** Default size (pt) and alignment of every kind of inscription. */
const ROLE: Record<Role, [number, Align]> = {
  co: [8.5, "left"],
  no: [8.5, "right"],
  h1: [21, "center"],
  h2: [11, "center"],
  t2: [15, "center"],
  lb: [9, "left"],
  v: [9.5, "left"],
  sec: [11, "left"],
  th: [9, "center"],
  td: [9.5, "left"],
  tc: [9.5, "center"],
  p: [10, "left"],
  ft: [7.5, "left"],
  fr: [7.5, "right"]
};

const PAGES: Record<number, Block[]> = {
  1: [
    { k: "head", ids: ["a1co", "a1no"] },
    { k: "title", ids: ["a1h1", "a1h2"] },
    {
      k: "grid",
      cols: "info",
      rows: [
        ["i1l", "i1v", "i2l", "=DEMO-50"],
        ["i3l", "i3v", "i4l", "=DEMO-2611"],
        ["i5l", "i5v", "i6l", "i6v"]
      ]
    },
    { k: "sec", id: "s1" },
    {
      k: "grid",
      cols: "res",
      th: true,
      rows: [
        ["hn", "hi", "hr", "hm", "hv"],
        ["=1", "r1i", "r1r", "r1m", "r1v"],
        ["=2", "r2i", "r2r", "r2m", "r2v"],
        ["=3", "r3i", "r3r", "r3m", "r3v"],
        ["=4", "r4i", "r4r", "r4m", "r4v"]
      ]
    },
    { k: "p", id: "cc" },
    {
      k: "sign",
      stamp: "big",
      cells: [
        ["g1", "~a"],
        ["g2", "~b"],
        ["g3", "g3v"]
      ]
    },
    { k: "foot", ids: ["f1", "f1p"] }
  ],
  2: [
    { k: "head", ids: ["b2co", "b2no"] },
    { k: "title", ids: ["b2h1"] },
    {
      k: "grid",
      cols: "spec",
      rows: [
        ["k1p", "=DN50"],
        ["k2p", "=PN16 (1.6 MPa)"],
        ["k3p", "k3v"],
        ["k4p", "k4v"],
        ["k5p", "k5v"],
        ["k6p", "k6v"]
      ]
    },
    { k: "sec", id: "s2" },
    {
      k: "grid",
      cols: "kit",
      th: true,
      rows: [
        ["kh1", "kh2"],
        ["m1n", "m1q"],
        ["m2n", "m2q"],
        ["m3n", "m3q"]
      ]
    },
    { k: "sec", id: "s3" },
    { k: "p", id: "w1" },
    { k: "sign", stamp: "small", cells: [["g4", "~c"]] },
    { k: "foot", ids: ["f2", "f2p"] }
  ]
};

/** The job's stages as the backend reports them: label key, duration (ms), progress at the end. */
const STAGES: Array<[string, number, number]> = [
  ["INSPECTING", 900, 8],
  ["OCR", 1500, 24],
  ["LAYOUT_ANALYSIS", 1300, 38],
  ["TM_MATCHING", 1000, 48],
  ["TRANSLATING", 2000, 70],
  ["RASTER_RENDERING", 2600, 90],
  ["QA", 1300, 100]
];
const TOTAL_MS = STAGES.reduce((sum, [, ms]) => sum + ms, 0);
/** Translated page images appear while the pages are assembled, before the final PDF. */
const PAGE_READY_MS = [7600, 9300];
const SOURCE_LANGS = ["zh", "ru", "en", "de", "pl", "fr", "es"];
const TARGET_LANGS = ["ru", "en", "de", "pl", "fr", "es"];
const ALIGNS: Align[] = ["left", "center", "right"];

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/* ── strings ── */
const ru = {
  home: "Translate — на главную",
  help: "Как пользоваться",
  user: "Гость",
  logout: "Выйти из учётной записи",
  cancel: "Отменить",
  cancelJob: (f: string) => `Отменить обработку: ${f}`,
  leftShort: (d: string) => `осталось ${d}`,
  sec: (n: number) => `${n} с`,
  minSec: (m: number, s: string) => `${m} мин ${s} с`,
  lessMin: "< 1 мин",
  drop: "Перетащите файлы сюда или нажмите для выбора",
  dropHint: "PDF, Word, Excel или скан (JPG, PNG, TIFF) до 50 МБ",
  demoFiles: "В демо свои файлы не загружаются —",
  sample: "Взять пример",
  oneSample: "В демо один документ-пример. «Начать заново» — пройти ещё раз",
  params: "Параметры перевода",
  srcLang: "Исходный язык",
  dstLang: "Язык перевода",
  auto: "Определить автоматически",
  langs: {
    zh: "Китайский",
    ru: "Русский",
    en: "Английский",
    de: "Немецкий",
    pl: "Польский",
    fr: "Французский",
    es: "Испанский"
  } as Record<string, string>,
  into: (l: string) => `На ${l.toLowerCase()}`,
  notInDemo: "не в демо",
  more: "Дополнительно: языки, указания, образец",
  others: "Текст на других языках",
  otherOpts: [
    "Переводить все языки",
    "Другие языки оставить как есть",
    "Другие языки убрать"
  ],
  othersNote: "Сначала выберите исходный язык: переводится только он.",
  example: "Образец перевода (Word, Excel или PDF с текстом)",
  exampleBtn: "Выбрать файл",
  exampleNone: "Файл не выбран",
  instr: "Указания переводчику",
  instrPh: "Например: «Material» переводить как «Материал», даты в формате ДД.ММ.ГГГГ",
  docs: "Документы",
  remove: "Удалить",
  translate: "Перевести",
  uploading: "Загружаем",
  ready: "Готовые документы",
  pager: "Страницы",
  prev: "Предыдущая страница",
  next: "Следующая страница",
  of: "из",
  period: "Период",
  today: "Сегодня",
  empty: "Пока нет готовых документов",
  status: { processing: "В обработке", done: "Готово", cancelled: "Отменён" },
  open: "Открыть и проверить",
  download: "Скачать",
  notYet: "Файл пока недоступен",
  rerun: "Повторить прогон",
  noResult: "Нет результата",
  stages: {
    INSPECTING: "Проверяем документ",
    OCR: "Распознаём текст",
    LAYOUT_ANALYSIS: "Анализируем макет",
    TM_MATCHING: "Ищем совпадения",
    TRANSLATING: "Переводим",
    RASTER_RENDERING: "Собираем страницы-изображения",
    QA: "Проверяем результат"
  } as Record<string, string>,
  left: (d: string) => `Осталось ${d}`,
  almost: "Почти готово",
  items: (a: number, b: number) => `${a} из ${b} страниц`,
  running: (a: string, b: string) => `Идёт ${a} · всего ${b}`,
  progress: "Готовность документа",
  cancelQ: "Отменить обработку?",
  cancelText:
    "Текущее задание будет остановлено. Уже созданные промежуточные файлы останутся в системе.",
  keepGoing: "Продолжить обработку",
  stop: "Остановить",
  rerunQ: "Повторить прогон?",
  rerunText: (f: string) =>
    `«${f}» пройдёт обработку с начала. Текущий перевод и правки, сделанные в нём вручную, заменятся новым результатом.`,
  keep: "Оставить как есть",
  helpTitle: "Обработка документов",
  helpText:
    "Загрузите файлы, выберите нужное действие и заберите готовый результат — готовые документы появятся в журнале ниже.",
  helpSteps: [
    [
      "1. Добавьте документы",
      "Выберите файлы с компьютера или перетащите их в область загрузки."
    ],
    [
      "2. Начните перевод",
      "Сервис проанализирует структуру документа и переведёт содержимое."
    ],
    [
      "3. Проверьте результат",
      "Отслеживайте ход обработки — статус появится в карточке документа."
    ],
    [
      "4. Заберите результат",
      "Готовые файлы можно открыть для проверки или скачать на компьютер."
    ]
  ],
  close: "Закрыть",
  viewLabel: (f: string) => `Просмотр файла ${f}`,
  going: "Перевод идёт",
  saving: "Сохраняем…",
  unsaved: (n: number) => {
    const two = n % 100;
    const one = n % 10;
    const adj =
      two >= 11 && two <= 14
        ? "несохранённых"
        : one === 1
          ? "несохранённая"
          : "несохранённых";
    const noun =
      two >= 11 && two <= 14
        ? "правок"
        : one === 1
          ? "правка"
          : one >= 2 && one <= 4
            ? "правки"
            : "правок";
    return `${n} ${adj} ${noun}`;
  },
  allSaved: "Всё сохранено",
  savedAt: (t: string) => `Сохранено в ${t}`,
  modesLabel: "Режим работы с документом",
  modes: { edit: "Редактирование", compare: "Сравнение", review: "Журнал" } as Record<
    string,
    string
  >,
  noCompare: "Сравнивать пока не с чем: нет второй версии",
  moreMenu: "Ещё",
  dlOriginal: "Скачать оригинал",
  sync: "Синхронная прокрутка",
  syncTitle:
    "Синхронная прокрутка: в сравнении оригинал и перевод идут за одной страницей",
  save: "Сохранить",
  saveEdits: "Сохранить правки",
  closeDoc: "Закрыть документ",
  page: (a: number, b: number) => `Страница ${a} из ${b}`,
  toolText: "Текст",
  toolTextTitle: "Нажмите на фразу, чтобы выделить её; второй щелчок открывает редактор",
  toolArea: "Заменить область",
  toolAreaTitle: "Заменить область своим текстом — в демо не показано",
  toolErase: "Ластик",
  toolEraseTitle: "Обведите кривой или лишний текст — область будет закрашена",
  undo: "Отменить последнее изменение (Ctrl+Z)",
  redo: "Вернуть последнее изменение (Ctrl+Y)",
  zoomOut: "Уменьшить",
  zoomIn: "Увеличить",
  zoomReset: "Вернуть масштаб 100%",
  partial: (n: number) =>
    `Предварительный перевод: готово страниц — ${n}. Общая проверка ещё не завершена.`,
  pageBusy: (n: number) => `Страница ${n} ещё обрабатывается`,
  eraseBold: "Обведите текст, который нужно затереть",
  eraseRest: " — фон листа закроет область; позже сверху можно добавить текст",
  exitTool: "Выйти из режима",
  resize: "Изменить ширину панелей",
  sides: { source: "Оригинал", result: "Перевод" } as Record<Side, string>,
  sidesLabel: "Какую сторону показать",
  badge: (n: number, v: number) => `PDF · ${n} стр. · версия ${v}`,
  editUnit: (s: string) => `Изменить перевод: ${s}`,
  rebuilding: (n: number) => `Пересобираем лист ${n}…`,
  tbLabel: "Действия с выделенной фразой",
  tbSel: "Выделенный текст",
  tbEdit: "Править",
  tbEditTitle: "Править перевод фразы",
  tbRe: "Перевести заново",
  tbReTitle: "Перевести фразу заново с оригинала",
  tbUndo: "Отменить правку этой фразы",
  tbDel: "Удалить фразу с листа",
  tbRestore: "Восстановить",
  tbRestoreTitle: "Восстановить фразу",
  edTitle: "Правка перевода",
  edSub: "Правка видна на листе сразу, в PDF попадёт после «Сохранить»",
  edOriginal: "Оригинал",
  edTranslation: "Перевод",
  edSwap: "Подставить оригинал в перевод",
  edFormat: "Формат",
  edSize: "Размер",
  edSizeLabel: "Размер текста",
  edSmaller: "Уменьшить размер текста",
  edBigger: "Увеличить размер текста",
  edAlign: "Выравнивание",
  alignLetter: { left: "Л", center: "Ц", right: "П" } as Record<Align, string>,
  alignName: {
    left: "по левому краю",
    center: "по центру",
    right: "по правому краю"
  } as Record<Align, string>,
  edSuggest: "Предложить перевод",
  edDelete: "Удалить фразу",
  apply: "Применить",
  edits: "Правки",
  asWas: "Как было",
  backEdits: "Вернуть правки",
  asWasTitle: "Показать документ, каким он сохранён, без этих правок",
  asWasNote:
    "На странице сохранённый вариант, без ваших правок. Правка выключена, пока он показан.",
  pageN: (n: number) => `Страница ${n}`,
  kinds: {
    TEXT_EDIT: "Текст изменён",
    TEXT_DELETE: "Текст удалён",
    TEXT_RESTYLED: "Оформление изменено",
    REGION_ERASE: "Область очищена"
  } as Record<Kind, string>,
  was: "было",
  now: "стало",
  textWord: "текст",
  eraseNote: "Область будет закрашена фоном листа",
  revert: "Отменить эту правку",
  showChange: "Показать эту правку на странице",
  editsHint:
    "Правки видны только вам, пока вы не нажмёте «Сохранить». Ctrl+Z отменяет последнюю, Ctrl+Y возвращает.",
  savingNote: (p: string) =>
    `Сохраняем ${p}… Не закрывайте окно, пока листы пересобираются.`,
  noEdits: "Правок нет.",
  sheet: (n: number, i: number, total: number) =>
    total > 1 ? `лист ${n} (${i} из ${total})` : `лист ${n}`,
  log: "Журнал",
  closeLog: "Закрыть журнал",
  yourEdits: "Ваши правки",
  noSaved: "Сохранённых правок пока нет.",
  unsavedTitle: "Несохранённые правки",
  attention: "Требуют внимания",
  attentionNone: "Конвейер ничего не отметил. Это не заменяет взгляда на лист.",
  logFoot: "Правки попадут в документ после «Сохранить».",
  pageShort: (n: number) => `с. ${n}`,
  wEdit: (a: string, b: string) => `«${a}» → «${b}»`,
  wDel: (a: string) => `Удалён «${a}»`,
  wSize: (pt: string, a: string) => `Кегль ${pt} pt у «${a}»`,
  wAlign: (al: string, a: string) => `Выравнивание ${al} у «${a}»`,
  wErase: "Затёрта область",
  tSaving: (p: string) => `Сохраняем ${p}… Не закрывайте окно.`,
  tSaved: (n: number) =>
    n > 1
      ? `Правки сохранены, листов пересобрано: ${n}`
      : "Правки сохранены, лист пересобран",
  tDownloaded: (f: string, v: number) =>
    `${f}, версия ${v}: перевод готов к выдаче (в демо без файла)`,
  tOriginal: `${FILE}: оригинал (в демо без файла)`,
  tUnsaved:
    "Правки не сохранены. Они ждут в окне документа — откройте его и нажмите «Сохранить».",
  demo: "Демо",
  restart: "Начать заново",
  coach: {
    empty: "Возьмите пример — или нажмите на зону загрузки",
    attached: "Языки выбраны — нажмите «Перевести»",
    processing: "Идёт перевод. Глаз в карточке откроет уже готовые листы",
    open: "Готово. Откройте документ — глаз в карточке",
    partial: "Готовые листы видны ещё до финальной сборки; править можно после неё",
    compare: "Нажмите «Сравнение» — оригинал встанет рядом с переводом",
    pick: "Нажмите на надпись в переводе, затем «Править»",
    apply: "Поправьте текст, кегль или выравнивание и нажмите «Применить»",
    save: "«Было → стало» — в панели правок. «Сохранить» пересоберёт только изменённый лист",
    saving: "Пересобираем только изменённый лист…",
    saved: "Сохранено — версия PDF выросла. Закройте документ и скачайте перевод",
    download: "Скачайте перевод — кнопка со стрелкой в карточке",
    downloaded: "Перевод готов к выдаче. «Начать заново» — пройти ещё раз",
    cancelled: "Обработка отменена — повторите прогон или начните заново"
  } as Record<string, string>
};
type Dict = typeof ru;

const en: Dict = {
  home: "Translate — home",
  help: "How to use",
  user: "Guest",
  logout: "Sign out",
  cancel: "Cancel",
  cancelJob: (f) => `Cancel processing: ${f}`,
  leftShort: (d) => `${d} left`,
  sec: (n) => `${n} s`,
  minSec: (m, s) => `${m} min ${s} s`,
  lessMin: "< 1 min",
  drop: "Drop files here or click to choose",
  dropHint: "PDF, Word, Excel or a scan (JPG, PNG, TIFF) up to 50 MB",
  demoFiles: "The demo doesn't upload your files —",
  sample: "Take the sample",
  oneSample: "The demo has one sample document. “Start over” to run it again",
  params: "Translation settings",
  srcLang: "Source language",
  dstLang: "Target language",
  auto: "Detect automatically",
  langs: {
    zh: "Chinese",
    ru: "Russian",
    en: "English",
    de: "German",
    pl: "Polish",
    fr: "French",
    es: "Spanish"
  },
  into: (l) => `Into ${l}`,
  notInDemo: "not in the demo",
  more: "More: languages, instructions, sample",
  others: "Text in other languages",
  otherOpts: [
    "Translate all languages",
    "Keep other languages as they are",
    "Remove other languages"
  ],
  othersNote: "Pick the source language first: only it is translated.",
  example: "Sample translation (Word, Excel or a PDF with text)",
  exampleBtn: "Choose file",
  exampleNone: "No file chosen",
  instr: "Instructions for the translator",
  instrPh: "For example: translate “Material” as “Werkstoff”, dates as DD.MM.YYYY",
  docs: "Documents",
  remove: "Remove",
  translate: "Translate",
  uploading: "Uploading",
  ready: "Finished documents",
  pager: "Pages",
  prev: "Previous page",
  next: "Next page",
  of: "of",
  period: "Period",
  today: "Today",
  empty: "No finished documents yet",
  status: { processing: "Processing", done: "Done", cancelled: "Cancelled" },
  open: "Open and review",
  download: "Download",
  notYet: "The file isn't available yet",
  rerun: "Run again",
  noResult: "No result",
  stages: {
    INSPECTING: "Inspecting the document",
    OCR: "Recognizing text",
    LAYOUT_ANALYSIS: "Analyzing the layout",
    TM_MATCHING: "Looking for matches",
    TRANSLATING: "Translating",
    RASTER_RENDERING: "Assembling image pages",
    QA: "Checking the result"
  },
  left: (d) => `${d} left`,
  almost: "Almost done",
  items: (a, b) => `${a} of ${b} pages`,
  running: (a, b) => `Running ${a} · ${b} in total`,
  progress: "Document progress",
  cancelQ: "Cancel processing?",
  cancelText:
    "The current job will be stopped. Intermediate files already created stay in the system.",
  keepGoing: "Keep processing",
  stop: "Stop",
  rerunQ: "Run again?",
  rerunText: (f) =>
    `“${f}” will be processed from the start. The current translation and the edits made in it by hand will be replaced by the new result.`,
  keep: "Leave as is",
  helpTitle: "Document processing",
  helpText:
    "Upload files, pick the action and take the result — finished documents appear in the journal below.",
  helpSteps: [
    [
      "1. Add documents",
      "Choose files on your computer or drop them onto the upload area."
    ],
    [
      "2. Start the translation",
      "The service analyzes the document's structure and translates its content."
    ],
    [
      "3. Check the result",
      "Follow the progress — the status shows in the document's card."
    ],
    ["4. Take the result", "Finished files can be opened for review or downloaded."]
  ],
  close: "Close",
  viewLabel: (f) => `Viewing ${f}`,
  going: "Translation in progress",
  saving: "Saving…",
  unsaved: (n) => `${n} unsaved ${n === 1 ? "edit" : "edits"}`,
  allSaved: "All saved",
  savedAt: (t) => `Saved at ${t}`,
  modesLabel: "Document mode",
  modes: { edit: "Edit", compare: "Compare", review: "Log" },
  noCompare: "Nothing to compare yet: there is no second version",
  moreMenu: "More",
  dlOriginal: "Download the original",
  sync: "Synchronized scrolling",
  syncTitle: "Synchronized scrolling: in comparison the original follows the translation",
  save: "Save",
  saveEdits: "Save edits",
  closeDoc: "Close the document",
  page: (a, b) => `Page ${a} of ${b}`,
  toolText: "Text",
  toolTextTitle: "Click a phrase to select it; a second click opens the editor",
  toolArea: "Replace area",
  toolAreaTitle: "Replace an area with your own text — not shown in the demo",
  toolErase: "Eraser",
  toolEraseTitle: "Draw around crooked or extra text — the area gets painted over",
  undo: "Undo the last change (Ctrl+Z)",
  redo: "Redo the last change (Ctrl+Y)",
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  zoomReset: "Reset zoom to 100%",
  partial: (n) =>
    `Preliminary translation: pages ready — ${n}. The overall check isn't finished yet.`,
  pageBusy: (n) => `Page ${n} is still being processed`,
  eraseBold: "Draw around the text to erase",
  eraseRest: " — the page background covers the area; text can be added on top later",
  exitTool: "Leave the mode",
  resize: "Resize the panes",
  sides: { source: "Original", result: "Translation" },
  sidesLabel: "Which side to show",
  badge: (n, v) => `PDF · ${n} pp. · version ${v}`,
  editUnit: (s) => `Edit the translation: ${s}`,
  rebuilding: (n) => `Rebuilding page ${n}…`,
  tbLabel: "Actions for the selected phrase",
  tbSel: "Selected text",
  tbEdit: "Edit",
  tbEditTitle: "Edit the phrase's translation",
  tbRe: "Translate again",
  tbReTitle: "Translate the phrase again from the original",
  tbUndo: "Undo this phrase's edit",
  tbDel: "Delete the phrase from the page",
  tbRestore: "Restore",
  tbRestoreTitle: "Restore the phrase",
  edTitle: "Edit translation",
  edSub: "The edit shows on the page at once and goes into the PDF on “Save”",
  edOriginal: "Original",
  edTranslation: "Translation",
  edSwap: "Copy the original into the translation",
  edFormat: "Format",
  edSize: "Size",
  edSizeLabel: "Text size",
  edSmaller: "Smaller text",
  edBigger: "Larger text",
  edAlign: "Alignment",
  alignLetter: { left: "L", center: "C", right: "R" },
  alignName: { left: "left", center: "centered", right: "right" },
  edSuggest: "Suggest a translation",
  edDelete: "Delete the phrase",
  apply: "Apply",
  edits: "Edits",
  asWas: "As it was",
  backEdits: "Show edits",
  asWasTitle: "Show the document as saved, without these edits",
  asWasNote:
    "The page shows the saved version, without your edits. Editing is off meanwhile.",
  pageN: (n) => `Page ${n}`,
  kinds: {
    TEXT_EDIT: "Text changed",
    TEXT_DELETE: "Text deleted",
    TEXT_RESTYLED: "Formatting changed",
    REGION_ERASE: "Area cleared"
  },
  was: "was",
  now: "now",
  textWord: "text",
  eraseNote: "The area will be painted with the page background",
  revert: "Undo this edit",
  showChange: "Show this edit on the page",
  editsHint:
    "Only you see the edits until you press “Save”. Ctrl+Z undoes the last one, Ctrl+Y redoes it.",
  savingNote: (p) => `Saving ${p}… Keep the window open while pages are rebuilt.`,
  noEdits: "No edits.",
  sheet: (n, i, total) => (total > 1 ? `page ${n} (${i} of ${total})` : `page ${n}`),
  log: "Log",
  closeLog: "Close the log",
  yourEdits: "Your edits",
  noSaved: "No saved edits yet.",
  unsavedTitle: "Unsaved edits",
  attention: "Need attention",
  attentionNone: "The pipeline flagged nothing. That doesn't replace a look at the page.",
  logFoot: "Edits get into the document after “Save”.",
  pageShort: (n) => `p. ${n}`,
  wEdit: (a, b) => `“${a}” → “${b}”`,
  wDel: (a) => `Deleted “${a}”`,
  wSize: (pt, a) => `Size ${pt} pt for “${a}”`,
  wAlign: (al, a) => `Alignment ${al} for “${a}”`,
  wErase: "Area erased",
  tSaving: (p) => `Saving ${p}… Keep the window open.`,
  tSaved: (n) =>
    n > 1 ? `Edits saved, pages rebuilt: ${n}` : "Edits saved, page rebuilt",
  tDownloaded: (f, v) =>
    `${f}, version ${v}: the translation is ready (no file in the demo)`,
  tOriginal: `${FILE}: the original (no file in the demo)`,
  tUnsaved:
    "Edits aren't saved. They wait in the document window — open it and press “Save”.",
  demo: "Demo",
  restart: "Start over",
  coach: {
    empty: "Take the sample — or click the upload area",
    attached: "Languages are set — press “Translate”",
    processing: "Translating. The eye in the card opens the pages that are ready",
    open: "Done. Open the document — the eye in the card",
    partial: "Ready pages show before the final assembly; editing opens after it",
    compare: "Press “Compare” — the original lines up next to the translation",
    pick: "Click an inscription in the translation, then “Edit”",
    apply: "Fix the text, size or alignment and press “Apply”",
    save: "“Was → now” is in the edits panel. “Save” rebuilds only the changed page",
    saving: "Rebuilding only the changed page…",
    saved: "Saved — the PDF version went up. Close the document and download it",
    download: "Download the translation — the arrow button in the card",
    downloaded: "The translation is ready. “Start over” to run it again",
    cancelled: "Processing cancelled — run it again or start over"
  }
};
const DICT: Record<Lang, Dict> = { ru, en };

/* ── helpers ── */
function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => {
    const list = ids.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);
  return useMemo(
    () => ({
      later(fn: () => void, ms: number) {
        ids.current.push(window.setTimeout(fn, ms));
      },
      clear() {
        ids.current.forEach((id) => window.clearTimeout(id));
        ids.current.length = 0;
      }
    }),
    []
  );
}

function duration(t: Dict, seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return t.sec(total);
  return t.minSec(Math.floor(total / 60), String(total % 60).padStart(2, "0"));
}

const fmtPt = (value: number, lang: Lang) =>
  String(Math.round(value * 10) / 10).replace(".", lang === "ru" ? "," : ".");

function steppedSize(value: number, up: boolean) {
  const steps = value / 0.5;
  const next = up ? Math.floor(steps + 1e-6) + 1 : Math.ceil(steps - 1e-6) - 1;
  return clamp(next * 0.5, 0.5, 96);
}

const fmtDate = (date: Date, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short"
  })
    .format(date)
    .replace(", ", " ");

function lookOf(id: string, target: Target, layers: Layer[]): Look {
  const [role, , , ruText, enText] = UNITS[id];
  const look: Look = {
    text: target === "ru" ? ruText : enText,
    size: ROLE[role][0],
    align: ROLE[role][1],
    deleted: false
  };
  for (const layer of layers) Object.assign(look, layer.units[id]);
  return look;
}

function merge(saved: Layer, draft: Layer): Layer {
  const units = { ...saved.units };
  for (const [id, edit] of Object.entries(draft.units))
    units[id] = { ...units[id], ...edit };
  return { units, erased: [...saved.erased, ...draft.erased] };
}

/** What differs between the saved document and the draft on top of it. */
function diff(draft: Layer, saved: Layer, target: Target): Change[] {
  const out: Change[] = [];
  for (const id of Object.keys(draft.units)) {
    const a = lookOf(id, target, [saved]);
    const b = lookOf(id, target, [saved, draft]);
    const size: [number, number] | undefined =
      a.size !== b.size ? [a.size, b.size] : undefined;
    const align = a.align !== b.align ? b.align : undefined;
    const kind: Kind | null =
      a.deleted !== b.deleted
        ? b.deleted
          ? "TEXT_DELETE"
          : "TEXT_EDIT"
        : a.text !== b.text
          ? "TEXT_EDIT"
          : size || align
            ? "TEXT_RESTYLED"
            : null;
    if (!kind) continue;
    out.push({
      id,
      kind,
      page: UNITS[id][1],
      source: UNITS[id][2],
      before: a.text,
      after: kind === "TEXT_DELETE" ? "" : b.text,
      size,
      align,
      unitId: id
    });
  }
  for (const rect of draft.erased)
    out.push({
      id: rect.id,
      kind: "REGION_ERASE",
      page: rect.page,
      source: "",
      before: "",
      after: "",
      rectId: rect.id
    });
  return out.sort((x, y) => x.page - y.page);
}

function inWords(c: Change, t: Dict, lang: Lang): string[] {
  if (c.kind === "REGION_ERASE") return [t.wErase];
  if (c.kind === "TEXT_DELETE") return [t.wDel(c.before)];
  const lines = c.kind === "TEXT_EDIT" ? [t.wEdit(c.before, c.after)] : [];
  if (c.size) lines.push(t.wSize(fmtPt(c.size[1], lang), c.after));
  if (c.align) lines.push(t.wAlign(t.alignName[c.align], c.after));
  return lines;
}

/* ── small pieces ── */
const Spin = ({ className }: { className?: string }) => (
  <span
    className={`i-ph-circle-notch ${cx("spin")} ${className ?? ""}`}
    aria-hidden="true"
  />
);

function IconBtn({
  icon,
  label,
  onClick,
  disabled,
  square
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  square?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx("ibtn", square && "ibtn-sq")}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={icon} aria-hidden="true" />
    </button>
  );
}

function Logo() {
  return (
    <span className={cx("logo")}>
      <svg className={cx("logo-mark")} viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M29 5c14 0 26 8 26 19 0 6-4 11-10 14-5 2-10 3-16 3h-5l-11 9 3-12C9 35 3 30 3 23 3 12 15 5 29 5z"
          fill="#ececee"
        />
        <text
          x="26"
          y="31"
          textAnchor="middle"
          fontSize="19"
          fontWeight="700"
          fill="#1f1f23"
        >
          文
        </text>
        <path
          d="M40 28c11 0 21 6 21 15 0 6-4 10-9 12l3 8-11-6h-5c-11 0-19-6-19-14 0-9 9-15 20-15z"
          fill="#e10600"
          stroke="#1f1f23"
          strokeWidth="2.6"
        />
        <text
          x="41"
          y="51"
          textAnchor="middle"
          fontSize="17"
          fontWeight="800"
          fill="#fff"
        >
          A
        </text>
      </svg>
      <span className={cx("logo-word")}>Translate</span>
    </span>
  );
}

function Signature({ v }: { v: string }) {
  const d =
    v === "~b"
      ? "M4 30c8-2 12-20 18-21 5-1-3 24 3 24 6 0 9-18 15-18 4 0 1 14 6 14 7 0 12-9 20-11 9-2 16 1 50-4"
      : v === "~c"
        ? "M6 28c10-14 18-22 22-18 4 5-10 22-4 22 7 0 12-16 18-14 4 2-2 12 4 12 8 0 16-10 24-10 8 0 10 4 42 0"
        : "M6 34c6-8 10-26 16-26 4 0 2 18-2 24 6-6 12-16 18-16 3 0-1 12 3 12 6 0 10-8 16-8 5 0 4 6 9 6 8 0 16-6 46-8";
  return (
    <svg className={cx("sig")} viewBox="0 0 120 44" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 40c28-4 64-6 100-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The quality-control stamp: graphics, kept as printed in the translation too. */
function Stamp({ small }: { small: boolean }) {
  const id = `dmtr-arc-${useId().replace(/:/g, "")}`;
  return (
    <svg
      className={cx("stamp", small && "stamp-sm")}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <defs>
        <path id={id} d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
      </defs>
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      <text fill="currentColor" fontSize="12.5" fontWeight="700">
        <textPath href={`#${id}`} startOffset="3" textLength="135" lengthAdjust="spacing">
          演示阀门制造有限公司
        </textPath>
      </text>
      <text x="60" y="72" textAnchor="middle" fontSize="30" fill="currentColor">
        ★
      </text>
      <text
        x="60"
        y="96"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fill="currentColor"
      >
        检验专用章
      </text>
    </svg>
  );
}

/* ── one sheet of the document, original or translation ── */
interface SheetProps {
  page: number;
  side: Side;
  t: Dict;
  look?: (id: string) => Look;
  frames?: boolean;
  selected?: string | null;
  pulse?: string | null;
  draftIds?: Set<string>;
  erased?: Rect[];
  draftRects?: Set<string>;
  eraser?: boolean;
  rebuilding?: boolean;
  overlay?: ReactNode;
  onUnit?: (id: string, el: HTMLElement) => void;
  onErase?: (rect: Omit<Rect, "id">) => void;
  onBlank?: () => void;
}

function Sheet(p: SheetProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | {
    x0: number;
    y0: number;
    x: number;
    y: number;
  }>(null);
  const source = p.side === "source";

  const u = (id: string): ReactNode => {
    if (id.startsWith("=")) {
      return (
        <div key={id} className={cx("u", "plain")}>
          {id.slice(1)}
        </div>
      );
    }
    if (id.startsWith("~")) return <Signature key={id} v={id} />;
    const [role, , zh] = UNITS[id];
    const look: Look =
      source || !p.look
        ? { text: zh, size: ROLE[role][0], align: ROLE[role][1], deleted: false }
        : p.look(id);
    const style: CSSProperties = {
      fontSize: `calc(${look.size} * var(--dm-pt))`,
      textAlign: look.align
    };
    if (source || !p.frames) {
      return (
        <div key={id} className={cx("u", role, look.deleted && "gone")} style={style}>
          {look.text}
        </div>
      );
    }
    const state =
      p.selected === id
        ? "sel"
        : look.deleted
          ? "del"
          : p.draftIds?.has(id)
            ? "draft"
            : null;
    return (
      <button
        key={id}
        type="button"
        className={cx("u", role, "frame", state, p.pulse === id && "pulse")}
        style={style}
        data-unit={id}
        aria-pressed={p.selected === id}
        aria-label={p.t.editUnit(look.text)}
        title={look.text}
        onClick={(event) => p.onUnit?.(id, event.currentTarget)}
      >
        {look.text}
      </button>
    );
  };

  const point = (event: ReactPointerEvent) => {
    const r = pageRef.current!.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - r.left) / r.width) * 100, 0, 100),
      y: clamp(((event.clientY - r.top) / r.height) * 100, 0, 100)
    };
  };
  const box = (d: { x0: number; y0: number; x: number; y: number }) => ({
    x: Math.min(d.x0, d.x),
    y: Math.min(d.y0, d.y),
    w: Math.abs(d.x - d.x0),
    h: Math.abs(d.y - d.y0)
  });
  const place = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({
    left: `${r.x}%`,
    top: `${r.y}%`,
    width: `${r.w}%`,
    height: `${r.h}%`
  });

  const block = (b: Block, i: number): ReactNode => {
    switch (b.k) {
      case "head":
        return (
          <header key={i} className={cx("sh-head")}>
            {b.ids.map(u)}
          </header>
        );
      case "title":
        return (
          <div key={i} className={cx("sh-title")}>
            {b.ids.map(u)}
          </div>
        );
      case "foot":
        return (
          <footer key={i} className={cx("sh-foot")}>
            {b.ids.map(u)}
          </footer>
        );
      case "sec":
        return (
          <div key={i} className={cx("sh-sec")}>
            {u(b.id)}
          </div>
        );
      case "p":
        return (
          <div key={i} className={cx("sh-p")}>
            {u(b.id)}
          </div>
        );
      case "grid":
        return (
          <div key={i} className={cx("sh-grid", `g-${b.cols}`)}>
            {b.rows.flatMap((row, r) =>
              row.map((id, c) => (
                <div
                  key={`${r}-${c}`}
                  className={cx(
                    "sh-cell",
                    b.th && r === 0 && "sh-th",
                    UNITS[id]?.[0] === "lb" && "sh-lb"
                  )}
                >
                  {u(id)}
                </div>
              ))
            )}
          </div>
        );
      case "sign":
        return (
          <div
            key={i}
            className={cx("sh-sign")}
            style={{ "--dm-n": b.cells.length } as CSSProperties}
          >
            {b.cells.map((cell, c) => (
              <div key={c} className={cx("sh-sign-cell")}>
                {cell.map(u)}
              </div>
            ))}
            <Stamp small={b.stamp === "small"} />
          </div>
        );
    }
  };

  return (
    <div className={cx("sheet")}>
      <div
        ref={pageRef}
        className={cx("page", source ? "zh" : "lat")}
        data-page-el={p.page}
        onClick={(event) => event.target === event.currentTarget && p.onBlank?.()}
      >
        {PAGES[p.page].map(block)}
        {(p.erased ?? [])
          .filter((r) => r.page === p.page)
          .map((r) => (
            <span
              key={r.id}
              data-rect={r.id}
              className={cx(
                "erased",
                p.frames && p.draftRects?.has(r.id) && "erased-draft",
                p.pulse === r.id && "pulse"
              )}
              style={place(r)}
            />
          ))}
        {p.eraser && (
          <div
            className={cx("erase-layer")}
            aria-hidden="true"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              const { x, y } = point(event);
              setDrag({ x0: x, y0: y, x, y });
            }}
            onPointerMove={(event) => drag && setDrag({ ...drag, ...point(event) })}
            onPointerUp={() => {
              if (!drag) return;
              const r = box(drag);
              if (r.w > 1.5 && r.h > 0.8) p.onErase?.({ page: p.page, ...r });
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            {drag && <span className={cx("erasing")} style={place(box(drag))} />}
          </div>
        )}
        {p.rebuilding && (
          <div className={cx("rebuild")} role="status">
            <Spin />
            {p.t.rebuilding(p.page)}
          </div>
        )}
        {p.overlay}
      </div>
    </div>
  );
}

function FontSize({
  value,
  onChange,
  t,
  lang
}: {
  value: number;
  onChange: (value: number) => void;
  t: Dict;
  lang: Lang;
}) {
  const [text, setText] = useState(fmtPt(value, lang));
  useEffect(() => setText(fmtPt(value, lang)), [value, lang]);
  const commit = () => {
    const parsed = Number(text.trim().replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) onChange(clamp(parsed, 0.5, 96));
    else setText(fmtPt(value, lang));
  };
  return (
    <div className={cx("fs")}>
      <button
        type="button"
        aria-label={t.edSmaller}
        title={t.edSmaller}
        disabled={value <= 0.5}
        onClick={() => onChange(steppedSize(value, false))}
      >
        <span className="i-ph-minus" aria-hidden="true" />
      </button>
      <input
        inputMode="decimal"
        value={text}
        aria-label={t.edSizeLabel}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            onChange(steppedSize(value, event.key === "ArrowUp"));
          }
        }}
      />
      <span className={cx("fs-unit")}>pt</span>
      <button
        type="button"
        aria-label={t.edBigger}
        title={t.edBigger}
        disabled={value >= 96}
        onClick={() => onChange(steppedSize(value, true))}
      >
        <span className="i-ph-plus" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── the translation editor of one phrase ── */
function Editor({
  id,
  t,
  lang,
  target,
  look,
  machine,
  canUndo,
  later,
  onPreview,
  onApply,
  onClose,
  onUndo,
  onDelete
}: {
  id: string;
  t: Dict;
  lang: Lang;
  target: Target;
  look: Look;
  machine: string;
  canUndo: boolean;
  later: (fn: () => void, ms: number) => void;
  onPreview: (look: Look) => void;
  onApply: (look: Look) => void;
  onClose: () => void;
  onUndo: () => void;
  onDelete: (deleted: boolean) => void;
}) {
  const [cur, setCur] = useState<Look>(look);
  const [busy, setBusy] = useState(false);
  const zh = UNITS[id][2];
  const dirty =
    cur.text !== look.text || cur.size !== look.size || cur.align !== look.align;
  const update = (patch: Partial<Look>) => {
    const next = { ...cur, ...patch };
    setCur(next);
    onPreview(next);
  };

  return (
    <div className={cx("ed-wrap")}>
      <div
        className={cx("ed")}
        role="dialog"
        aria-label={t.edTitle}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <div className={cx("ed-head")}>
          <div className={cx("ed-titlebox")}>
            <span className={cx("ed-icon")} aria-hidden="true">
              <span className="i-ph-translate" />
            </span>
            <div>
              <p className={cx("ed-title")}>{t.edTitle}</p>
              <p className={cx("ed-sub")}>{t.edSub}</p>
            </div>
          </div>
          <IconBtn icon="i-ph-x" label={t.close} onClick={onClose} square />
        </div>

        <div className={cx("ed-grid")}>
          <div className={cx("ed-col")}>
            <label htmlFor={`dmtr-src-${id}`} className={cx("ed-label")}>
              {t.edOriginal}
            </label>
            <textarea
              id={`dmtr-src-${id}`}
              className={cx("ta", "ta-ro")}
              value={zh}
              readOnly
              rows={3}
            />
          </div>
          <button
            type="button"
            className={cx("swap")}
            title={t.edSwap}
            aria-label={t.edSwap}
            onClick={() => update({ text: zh })}
          >
            <span className="i-ph-arrows-left-right" aria-hidden="true" />
          </button>
          <div className={cx("ed-col")}>
            <div className={cx("ed-labelrow")}>
              <label htmlFor={`dmtr-dst-${id}`} className={cx("ed-label")}>
                {t.edTranslation}
              </label>
              <span>{target.toUpperCase()}</span>
            </div>
            <textarea
              id={`dmtr-dst-${id}`}
              className={cx("ta", "ta-main")}
              value={cur.text}
              rows={3}
              autoFocus
              onChange={(event) => update({ text: event.target.value })}
            />
          </div>
        </div>

        <div className={cx("ed-format")}>
          <span className={cx("ed-k")}>{t.edFormat}</span>
          <span className={cx("ed-k")}>
            {t.edSize}
            <FontSize
              value={cur.size}
              onChange={(size) => update({ size })}
              t={t}
              lang={lang}
            />
          </span>
          <span className={cx("ed-vsep")} aria-hidden="true" />
          <span className={cx("ed-k")}>{t.edAlign}</span>
          <div className={cx("seg", "seg-sm")} role="group" aria-label={t.edAlign}>
            {ALIGNS.map((align) => (
              <button
                key={align}
                type="button"
                aria-pressed={cur.align === align}
                aria-label={`${t.edAlign}: ${t.alignName[align]}`}
                className={cx("seg-btn", cur.align === align && "on")}
                onClick={() => update({ align })}
              >
                {t.alignLetter[align]}
              </button>
            ))}
          </div>
        </div>

        <div className={cx("ed-foot")}>
          <button
            type="button"
            className={cx("btn-ghost")}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              later(() => {
                setBusy(false);
                update({ text: machine });
              }, 700);
            }}
          >
            {busy && <Spin />}
            {t.edSuggest}
          </button>
          <div className={cx("ed-actions")}>
            {(canUndo || dirty) && (
              <IconBtn
                icon="i-ph-arrow-u-up-left"
                label={t.tbUndo}
                square
                onClick={() => {
                  if (!dirty) return onUndo();
                  setCur(look);
                  onPreview(look);
                }}
              />
            )}
            <button
              type="button"
              className={cx("ibtn", "ibtn-sq", !look.deleted && "danger")}
              aria-label={look.deleted ? t.tbRestoreTitle : t.edDelete}
              title={look.deleted ? t.tbRestoreTitle : t.edDelete}
              onClick={() => onDelete(!look.deleted)}
            >
              <span
                className={look.deleted ? "i-ph-arrow-u-up-left" : "i-ph-trash"}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className={cx("btn", "btn-sm")}
              disabled={look.deleted || !cur.text.trim()}
              onClick={() => onApply(cur)}
            >
              <span className="i-ph-check" aria-hidden="true" />
              {t.apply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── the list of unsaved edits: was → now ── */
const KIND_ICON: Record<Kind, string> = {
  TEXT_EDIT: "i-ph-pencil-line",
  TEXT_DELETE: "i-ph-trash",
  TEXT_RESTYLED: "i-ph-text-aa",
  REGION_ERASE: "i-ph-eraser"
};

function ChangesList({
  t,
  lang,
  changes,
  onFocus,
  onRevert
}: {
  t: Dict;
  lang: Lang;
  changes: Change[];
  onFocus: (c: Change) => void;
  onRevert?: (c: Change) => void;
}) {
  const groups: Array<{ page: number; items: Change[] }> = [];
  for (const c of changes) {
    const last = groups.at(-1);
    if (last && last.page === c.page) last.items.push(c);
    else groups.push({ page: c.page, items: [c] });
  }
  return (
    <div>
      {groups.map((group) => (
        <div key={group.page}>
          <p className={cx("cg")}>{t.pageN(group.page)}</p>
          {group.items.map((c) => {
            const deleted = c.kind === "TEXT_DELETE";
            const hasPrev = c.before.length > 0 && c.before !== c.after && !deleted;
            const details = [
              c.size && `${fmtPt(c.size[0], lang)} → ${fmtPt(c.size[1], lang)} pt`,
              c.align && t.alignName[c.align]
            ].filter(Boolean) as string[];
            return (
              <div key={c.id} className={cx("chg", `chg-${c.kind.toLowerCase()}`)}>
                <button
                  type="button"
                  className={cx("chg-main")}
                  title={t.showChange}
                  onClick={() => onFocus(c)}
                >
                  <span className={cx("chg-mark")} aria-hidden="true">
                    <span className={KIND_ICON[c.kind]} />
                  </span>
                  <span className={cx("chg-body")}>
                    <span className={cx("chg-kind")}>{t.kinds[c.kind]}</span>
                    {c.source && <span className={cx("chg-src")}>{c.source}</span>}
                    {(hasPrev || deleted) && (
                      <span className={cx("chg-line")}>
                        <span className={cx("chg-k")}>{t.was}</span>
                        <s className={cx("chg-was")}>{c.before || "—"}</s>
                      </span>
                    )}
                    {c.after ? (
                      <span className={cx("chg-line")}>
                        <span className={cx("chg-k")}>
                          {hasPrev ? t.now : t.textWord}
                        </span>
                        <span className={cx("chg-now")}>{c.after}</span>
                      </span>
                    ) : (
                      !deleted && <span className={cx("chg-note")}>{t.eraseNote}</span>
                    )}
                    {details.length > 0 && (
                      <span className={cx("chg-chips")}>
                        {details.map((d) => (
                          <span key={d}>{d}</span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
                {onRevert && (
                  <button
                    type="button"
                    className={cx("chg-undo")}
                    aria-label={t.revert}
                    title={t.revert}
                    onClick={() => onRevert(c)}
                  >
                    <span className="i-ph-arrow-u-up-left" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── the document window ── */
interface ViewerProps {
  t: Dict;
  lang: Lang;
  target: Target;
  processing: boolean;
  readyPages: number;
  saved: Layer;
  draft: Layer;
  changes: Change[];
  log: Entry[];
  canUndo: boolean;
  canRedo: boolean;
  saving: null | { page: number; text: string };
  savedAt: Date | null;
  version: number;
  commit: (layer: Layer) => void;
  undo: () => void;
  redo: () => void;
  applyUnit: (id: string, look: Look) => void;
  onSave: () => void;
  onClose: () => void;
  onStep: (step: string) => void;
  toast: (kind: ToastKind, text: string, ms?: number) => void;
  later: (fn: () => void, ms: number) => void;
}

function Viewer(v: ViewerProps) {
  const { t, lang, target, processing, draft, saved, changes, saving } = v;
  const [mode, setMode] = useState<Mode>("view");
  const [tool, setTool] = useState<"SELECT" | "ERASER">("SELECT");
  const [selected, setSelected] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; look: Look } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [sync, setSync] = useState(true);
  const [split, setSplit] = useState(50);
  const [side, setSide] = useState<Side>("source");
  const [showingSaved, setShowingSaved] = useState(false);
  const [pulse, setPulse] = useState<string | null>(null);
  const [curPage, setCurPage] = useState(1);
  const [menu, setMenu] = useState(false);
  const [retrans, setRetrans] = useState(false);
  const [tbPos, setTbPos] = useState<{ page: number; left: number; top: number } | null>(
    null
  );
  const [, setTick] = useState(0);
  const srcRef = useRef<HTMLDivElement>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const panesRef = useRef<HTMLDivElement>(null);
  const tbRef = useRef<HTMLDivElement>(null);
  const echo = useRef<{ el: HTMLElement | null; top: number }>({ el: null, top: 0 });
  const pendingRatio = useRef<number | null>(null);

  const canCompare = !processing;
  const activeMode: Mode = mode === "compare" && !canCompare ? "view" : mode;
  const compare = activeMode === "compare";
  const editing = activeMode !== "view" && !processing;
  const editingPage = editing && !showingSaved;
  const frames = editingPage && !saving;
  const layers = editingPage ? [saved, draft] : [saved];
  const look = (id: string) =>
    preview?.id === id ? preview.look : lookOf(id, target, layers);
  const unsaved = changes.length;
  const draftIds = new Set(Object.keys(draft.units));
  const draftRects = new Set(draft.erased.map((r) => r.id));
  const erased = [...saved.erased, ...(editingPage ? draft.erased : [])];

  const step = processing
    ? "partial"
    : saving
      ? "saving"
      : unsaved
        ? "save"
        : editorId
          ? "apply"
          : v.version > 1
            ? "saved"
            : editing
              ? "pick"
              : "compare";
  const { onStep } = v;
  useEffect(() => onStep(step), [step, onStep]);

  // the floating toolbar follows the selected phrase and stays inside its page
  useLayoutEffect(() => {
    if (!selected || editorId || !frames) {
      if (tbPos) setTbPos(null);
      return;
    }
    const el = resRef.current?.querySelector<HTMLElement>(`[data-unit="${selected}"]`);
    const pageEl = el?.closest<HTMLElement>("[data-page-el]");
    if (!el || !pageEl) return;
    const r = el.getBoundingClientRect();
    const pr = pageEl.getBoundingClientRect();
    const w = tbRef.current?.offsetWidth ?? 220;
    const center = r.left - pr.left + r.width / 2;
    const left =
      pr.width <= w + 8 ? pr.width / 2 : clamp(center, w / 2 + 4, pr.width - w / 2 - 4);
    const top = r.top - pr.top < 52 ? r.bottom - pr.top + 8 : r.top - pr.top - 48;
    const next = {
      page: Number(pageEl.dataset.pageEl),
      left: Math.round(left),
      top: Math.round(top)
    };
    if (
      !tbPos ||
      tbPos.page !== next.page ||
      tbPos.left !== next.left ||
      tbPos.top !== next.top
    )
      setTbPos(next);
  });

  useEffect(() => {
    const el = resRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setTick((n) => n + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // the editor docks at the bottom of the pane: the phrase moves up so it stays in view
  useEffect(() => {
    const pane = resRef.current;
    const el = editorId && pane?.querySelector<HTMLElement>(`[data-unit="${editorId}"]`);
    if (!pane || !el) return;
    pane.scrollTop +=
      el.getBoundingClientRect().top -
      pane.getBoundingClientRect().top -
      pane.clientHeight * 0.12;
  }, [editorId]);

  // entering the comparison: the original starts where the translation is
  useLayoutEffect(() => {
    const a = resRef.current;
    const b = srcRef.current;
    if (!compare || !a || !b) return;
    b.scrollTop =
      (a.scrollTop / Math.max(1, a.scrollHeight - a.clientHeight)) *
      (b.scrollHeight - b.clientHeight);
  }, [compare]);

  // narrow window: switching sides keeps the place
  useLayoutEffect(() => {
    const ratio = pendingRatio.current;
    pendingRatio.current = null;
    const to = side === "source" ? srcRef.current : resRef.current;
    if (ratio === null || !to || !sync) return;
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
  }, [side, sync]);

  const ratioOf = (el: HTMLElement | null) =>
    el ? el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight) : 0;

  function trackPage(el: HTMLElement) {
    let page = 1;
    const top = el.getBoundingClientRect().top + el.clientHeight * 0.3;
    el.querySelectorAll<HTMLElement>("[data-page-el]").forEach((node) => {
      if (node.getBoundingClientRect().top <= top) page = Number(node.dataset.pageEl);
    });
    if (page !== curPage) setCurPage(page);
  }

  function onScroll(from: Side) {
    const a = from === "source" ? srcRef.current : resRef.current;
    const b = from === "source" ? resRef.current : srcRef.current;
    if (!a) return;
    trackPage(a);
    if (echo.current.el === a && Math.abs(a.scrollTop - echo.current.top) < 2) {
      echo.current.el = null;
      return;
    }
    if (!sync || !compare || !b || b.clientHeight === 0) return;
    b.scrollTop = ratioOf(a) * (b.scrollHeight - b.clientHeight);
    b.scrollLeft =
      (a.scrollLeft / Math.max(1, a.scrollWidth - a.clientWidth)) *
      (b.scrollWidth - b.clientWidth);
    echo.current = { el: b, top: b.scrollTop };
  }

  function changeMode(next: Mode) {
    const goal = next === activeMode ? "view" : next;
    if (goal === "view") {
      setTool("SELECT");
      setSelected(null);
      setEditorId(null);
      setPreview(null);
      setShowingSaved(false);
    }
    if (goal === "compare") setSide("source");
    setMode(goal);
  }

  function pickSide(next: Side) {
    pendingRatio.current = ratioOf(side === "source" ? srcRef.current : resRef.current);
    setSide(next);
  }

  function closeEditor() {
    setEditorId(null);
    setPreview(null);
  }

  function eraseRect(rect: Omit<Rect, "id">) {
    v.commit({
      ...draft,
      erased: [...draft.erased, { ...rect, id: `e${Date.now()}` }]
    });
  }

  function onUnit(id: string, el: HTMLElement) {
    if (tool === "ERASER") {
      // keyboard path of the eraser: Enter on a phrase erases its frame
      const pageEl = el.closest<HTMLElement>("[data-page-el]");
      if (!pageEl) return;
      const r = el.getBoundingClientRect();
      const pr = pageEl.getBoundingClientRect();
      eraseRect({
        page: UNITS[id][1],
        x: ((r.left - pr.left) / pr.width) * 100,
        y: ((r.top - pr.top) / pr.height) * 100,
        w: (r.width / pr.width) * 100,
        h: (r.height / pr.height) * 100
      });
      return;
    }
    if (selected === id) {
      setEditorId(id);
      return;
    }
    closeEditor();
    setSelected(id);
  }

  function revertUnit(id: string) {
    const units = { ...draft.units };
    delete units[id];
    v.commit({ ...draft, units });
  }

  function revert(c: Change) {
    if (c.rectId)
      v.commit({ ...draft, erased: draft.erased.filter((r) => r.id !== c.rectId) });
    else if (c.unitId) revertUnit(c.unitId);
  }

  function focusChange(c: Change) {
    if (side !== "result") setSide("result");
    if (c.unitId) setSelected(c.unitId);
    const key = c.unitId ?? c.rectId ?? null;
    setPulse(key);
    v.later(() => setPulse((cur) => (cur === key ? null : cur)), 3200);
    window.requestAnimationFrame(() => {
      const pane = resRef.current;
      const el = pane?.querySelector<HTMLElement>(
        c.unitId ? `[data-unit="${c.unitId}"]` : `[data-rect="${c.rectId}"]`
      );
      if (!pane || !el) return;
      pane.scrollTop +=
        el.getBoundingClientRect().top -
        pane.getBoundingClientRect().top -
        pane.clientHeight / 3;
    });
  }

  function retranslate(id: string) {
    setRetrans(true);
    v.later(() => {
      setRetrans(false);
      v.applyUnit(id, {
        ...lookOf(id, target, [saved, draft]),
        text: lookOf(id, target, []).text
      });
    }, 800);
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    const key = event.key.toLowerCase();
    if (event.key === "Escape") {
      if (menu) setMenu(false);
      else if (editorId) closeEditor();
      else if (selected) setSelected(null);
      else if (tool !== "SELECT") setTool("SELECT");
      return;
    }
    const typing = (event.target as HTMLElement).closest("input, textarea, select");
    if (typing || !editingPage || saving || !(event.ctrlKey || event.metaKey)) return;
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      v.undo();
    } else if (key === "y" || (key === "z" && event.shiftKey)) {
      event.preventDefault();
      v.redo();
    }
  }

  function close() {
    if (unsaved) v.toast("info", t.tUnsaved, 4200);
    v.onClose();
  }

  const selLook = selected ? look(selected) : null;
  const toolbar =
    selected && selLook && frames && !editorId && tool === "SELECT" ? (
      <div
        ref={tbRef}
        role="toolbar"
        aria-label={t.tbLabel}
        className={cx("tb")}
        style={tbPos ? { left: tbPos.left, top: tbPos.top } : { visibility: "hidden" }}
        onClick={(event) => event.stopPropagation()}
      >
        <span className={cx("tb-label")}>{t.tbSel}</span>
        <span className={cx("tb-sep")} aria-hidden="true" />
        {selLook.deleted ? (
          <button
            type="button"
            className={cx("tb-btn")}
            title={t.tbRestoreTitle}
            onClick={() => v.applyUnit(selected, { ...selLook, deleted: false })}
          >
            <span className="i-ph-arrow-u-up-left" aria-hidden="true" />
            <span className={cx("tb-text")}>{t.tbRestore}</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className={cx("tb-btn")}
              title={t.tbEditTitle}
              onClick={() => setEditorId(selected)}
            >
              <span className={`i-ph-pencil-line ${cx("tb-ico")}`} aria-hidden="true" />
              <span className={cx("tb-text")}>{t.tbEdit}</span>
            </button>
            <button
              type="button"
              className={cx("tb-btn")}
              title={t.tbReTitle}
              disabled={retrans}
              onClick={() => retranslate(selected)}
            >
              <span
                className={`${retrans ? "i-ph-circle-notch" : "i-ph-sparkle"} ${cx("tb-blue", retrans && "spin")}`}
                aria-hidden="true"
              />
              <span className={cx("tb-text")}>{t.tbRe}</span>
            </button>
            <span className={cx("tb-sep")} aria-hidden="true" />
            {draftIds.has(selected) && (
              <button
                type="button"
                className={cx("tb-btn", "tb-sq")}
                title={t.tbUndo}
                aria-label={t.tbUndo}
                onClick={() => revertUnit(selected)}
              >
                <span className="i-ph-arrow-u-up-left" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className={cx("tb-btn", "tb-sq")}
              title={t.tbDel}
              aria-label={t.tbDel}
              onClick={() => v.applyUnit(selected, { ...selLook, deleted: true })}
            >
              <span className={`i-ph-trash ${cx("tb-rose")}`} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    ) : null;
  const toolbarPage = tbPos?.page ?? (selected ? UNITS[selected][1] : 0);

  const pages = (s: Side) =>
    Array.from({ length: PAGE_COUNT }, (_, i) => i + 1).map((n) =>
      s === "result" && processing && n > v.readyPages ? (
        <div key={n} className={cx("sheet")}>
          <div className={cx("page", "page-wait")} data-page-el={n}>
            <span>{t.pageBusy(n)}</span>
          </div>
        </div>
      ) : s === "source" ? (
        <Sheet key={n} page={n} side="source" t={t} />
      ) : (
        <Sheet
          key={n}
          page={n}
          side="result"
          t={t}
          look={look}
          frames={frames}
          selected={selected}
          pulse={pulse}
          draftIds={draftIds}
          erased={erased}
          draftRects={draftRects}
          eraser={frames && tool === "ERASER"}
          rebuilding={saving?.page === n}
          overlay={toolbarPage === n ? toolbar : null}
          onUnit={onUnit}
          onErase={eraseRect}
          onBlank={() => {
            setSelected(null);
            closeEditor();
          }}
        />
      )
    );

  const pane = (s: Side, children?: ReactNode) => (
    <section
      key={s}
      className={cx("pane", compare && side !== s && "pane-off")}
      aria-label={t.sides[s]}
    >
      <div
        ref={s === "source" ? srcRef : resRef}
        className={cx("pane-scroll")}
        style={{ "--dm-zoom": zoom } as CSSProperties}
        onScroll={() => onScroll(s)}
      >
        <div className={cx("doc")}>{pages(s)}</div>
      </div>
      <div className={cx("pane-badge")}>
        {s === "result" && processing
          ? `PDF · ${v.readyPages} / ${PAGE_COUNT}`
          : t.badge(PAGE_COUNT, s === "source" ? 1 : v.version)}
      </div>
      {children}
    </section>
  );

  const editor =
    editorId && frames ? (
      <Editor
        key={editorId}
        id={editorId}
        t={t}
        lang={lang}
        target={target}
        look={lookOf(editorId, target, [saved, draft])}
        machine={lookOf(editorId, target, []).text}
        canUndo={draftIds.has(editorId)}
        later={v.later}
        onPreview={(next) => setPreview({ id: editorId, look: next })}
        onApply={(next) => {
          v.applyUnit(editorId, next);
          closeEditor();
        }}
        onClose={closeEditor}
        onUndo={() => {
          revertUnit(editorId);
          closeEditor();
        }}
        onDelete={(deleted) => {
          v.applyUnit(editorId, { ...lookOf(editorId, target, [saved, draft]), deleted });
          closeEditor();
        }}
      />
    ) : null;

  const timeLocale = lang === "ru" ? "ru-RU" : "en-GB";
  const status = processing ? (
    <span className={cx("vstatus", "amber")}>
      <Spin />
      {t.going}
    </span>
  ) : saving ? (
    <span className={cx("vstatus")}>
      <Spin />
      {t.saving}
    </span>
  ) : unsaved ? (
    <button
      type="button"
      className={cx("vstatus", "amber", "vstatus-btn")}
      onClick={() => changeMode("review")}
    >
      <span className={cx("dot")} aria-hidden="true" />
      {t.unsaved(unsaved)}
    </button>
  ) : (
    <span className={cx("vstatus")}>
      <span className={`i-ph-cloud-check ${cx("emerald")}`} aria-hidden="true" />
      {v.savedAt
        ? t.savedAt(
            v.savedAt.toLocaleTimeString(timeLocale, {
              hour: "2-digit",
              minute: "2-digit"
            })
          )
        : t.allSaved}
    </span>
  );

  const modes: Array<[Mode, string]> = [
    ["edit", "i-ph-pencil-line"],
    ["compare", "i-ph-columns"],
    ["review", "i-ph-clock-counter-clockwise"]
  ];

  return (
    <div
      className={cx("viewer")}
      onKeyDown={onKeyDown}
      aria-label={t.viewLabel(FILE)}
      role="region"
    >
      <header className={cx("vhead")}>
        <div className={cx("vfile")}>
          <span className={cx("vfile-icon")} aria-hidden="true">
            <span className="i-ph-file-text" />
          </span>
          <p className={cx("vfile-name")} title={FILE}>
            {FILE}
          </p>
          <div className={cx("vstatus-box")}>{status}</div>
        </div>

        <div className={cx("modes")} role="group" aria-label={t.modesLabel}>
          {modes.map(([value, icon]) => {
            const off = value === "compare" && !canCompare;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={activeMode === value}
                disabled={off}
                title={off ? t.noCompare : t.modes[value]}
                className={cx("mode", activeMode === value && "on")}
                onClick={() => changeMode(value)}
              >
                <span className={icon} aria-hidden="true" />
                <span className={cx("mode-label")}>{t.modes[value]}</span>
                {value === "review" && unsaved > 0 && (
                  <span className={cx("mode-count")}>{unsaved}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className={cx("vactions")}>
          <div className={cx("menu-box")}>
            <IconBtn
              icon="i-ph-dots-three"
              label={t.moreMenu}
              square
              onClick={() => setMenu(!menu)}
            />
            {menu && (
              <div className={cx("menu")} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={cx("menu-item")}
                  onClick={() => {
                    setMenu(false);
                    v.toast("success", t.tOriginal, 3000);
                  }}
                >
                  <span className="i-ph-file-arrow-down" aria-hidden="true" />
                  {t.dlOriginal}
                </button>
              </div>
            )}
          </div>
          <label className={cx("sync")} title={t.syncTitle}>
            <span className="i-ph-link" aria-hidden="true" />
            <span className={cx("sync-label")}>{t.sync}</span>
            <button
              type="button"
              role="switch"
              aria-checked={sync}
              aria-label={t.sync}
              className={cx("switch", sync && "on")}
              onClick={() => setSync(!sync)}
            >
              <span />
            </button>
          </label>
          {(unsaved > 0 || saving) && (
            <button
              type="button"
              className={cx("btn", "btn-head")}
              disabled={!!saving}
              aria-label={t.saveEdits}
              onClick={v.onSave}
            >
              {saving ? (
                <Spin />
              ) : (
                <span className="i-ph-floppy-disk" aria-hidden="true" />
              )}
              {t.save}
              {unsaved > 0 && <span className={cx("btn-count")}>{unsaved}</span>}
            </button>
          )}
          <IconBtn icon="i-ph-x" label={t.closeDoc} square onClick={close} />
        </div>
      </header>

      <div className={cx("vbody")}>
        <section className={cx("docsec")} aria-label={t.sides.result}>
          <div className={cx("vbar")}>
            <p className={cx("vpage")}>
              {t.page(Math.min(curPage, PAGE_COUNT), PAGE_COUNT)}
            </p>
            {compare && (
              <div
                className={cx("seg", "sidepick")}
                role="group"
                aria-label={t.sidesLabel}
              >
                {(["source", "result"] as Side[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={side === s}
                    className={cx("seg-btn", side === s && "on")}
                    onClick={() => pickSide(s)}
                  >
                    {t.sides[s]}
                  </button>
                ))}
              </div>
            )}
            {editing && (
              <div className={cx("tools")}>
                <button
                  type="button"
                  className={cx("tool", tool === "SELECT" && "on")}
                  aria-pressed={tool === "SELECT"}
                  title={t.toolTextTitle}
                  disabled={!editingPage || !!saving}
                  onClick={() => setTool("SELECT")}
                >
                  <span className="i-ph-cursor" aria-hidden="true" />
                  <span className={cx("tool-label")}>{t.toolText}</span>
                </button>
                <button
                  type="button"
                  className={cx("tool")}
                  title={t.toolAreaTitle}
                  disabled
                >
                  <span className="i-ph-scan" aria-hidden="true" />
                  <span className={cx("tool-label")}>{t.toolArea}</span>
                </button>
                <button
                  type="button"
                  className={cx("tool", tool === "ERASER" && "on")}
                  aria-pressed={tool === "ERASER"}
                  title={t.toolEraseTitle}
                  disabled={!editingPage || !!saving}
                  onClick={() => {
                    setTool("ERASER");
                    setSelected(null);
                    closeEditor();
                  }}
                >
                  <span className="i-ph-eraser" aria-hidden="true" />
                  <span className={cx("tool-label")}>{t.toolErase}</span>
                </button>
              </div>
            )}
            <div className={cx("vbar-right")}>
              {editing && (
                <div className={cx("hist")}>
                  <IconBtn
                    icon="i-ph-arrow-u-up-left"
                    label={t.undo}
                    square
                    disabled={!v.canUndo || !!saving || !editingPage}
                    onClick={v.undo}
                  />
                  <IconBtn
                    icon="i-ph-arrow-u-up-right"
                    label={t.redo}
                    square
                    disabled={!v.canRedo || !!saving || !editingPage}
                    onClick={v.redo}
                  />
                </div>
              )}
              <div className={cx("zoom")}>
                <IconBtn
                  icon="i-ph-minus"
                  label={t.zoomOut}
                  square
                  disabled={zoom <= 0.5}
                  onClick={() => setZoom(clamp(zoom - 0.15, 0.5, 2.5))}
                />
                <button
                  type="button"
                  className={cx("zoom-val")}
                  title={t.zoomReset}
                  onClick={() => setZoom(1)}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <IconBtn
                  icon="i-ph-plus"
                  label={t.zoomIn}
                  square
                  disabled={zoom >= 2.5}
                  onClick={() => setZoom(clamp(zoom + 0.15, 0.5, 2.5))}
                />
              </div>
            </div>
          </div>

          {processing && (
            <p className={cx("strip", "strip-amber")}>
              <span>{t.partial(v.readyPages)}</span>
            </p>
          )}
          {frames && tool === "ERASER" && (
            <div className={cx("strip", "strip-amber")}>
              <p>
                <span className="i-ph-eraser" aria-hidden="true" />
                <span>
                  <b>{t.eraseBold}</b>
                  <span className={cx("strip-rest")}>{t.eraseRest}</span>
                </span>
              </p>
              <button
                type="button"
                className={cx("strip-btn")}
                onClick={() => setTool("SELECT")}
              >
                {t.exitTool}
              </button>
            </div>
          )}

          <div
            ref={panesRef}
            className={cx("panes", compare && "compare")}
            style={{ "--dm-split": `${split}%` } as CSSProperties}
          >
            {compare && pane("source")}
            {compare && (
              <div
                role="separator"
                tabIndex={0}
                aria-label={t.resize}
                aria-orientation="vertical"
                aria-valuemin={20}
                aria-valuemax={80}
                aria-valuenow={Math.round(split)}
                className={cx("divider")}
                onPointerDown={(event) =>
                  event.currentTarget.setPointerCapture(event.pointerId)
                }
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const r = panesRef.current!.getBoundingClientRect();
                  setSplit(clamp(((event.clientX - r.left) / r.width) * 100, 20, 80));
                }}
                onDoubleClick={() => setSplit(50)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  setSplit(clamp(split + (event.key === "ArrowLeft" ? -5 : 5), 20, 80));
                }}
              >
                <span />
              </div>
            )}
            {pane("result", editor)}
          </div>
        </section>

        {activeMode === "review" ? (
          <aside className={cx("aside")} aria-label={t.log}>
            <div className={cx("aside-head")}>
              <h2>{t.log}</h2>
              <IconBtn
                icon="i-ph-x"
                label={t.closeLog}
                square
                onClick={() => changeMode("view")}
              />
            </div>
            <div className={cx("aside-list")}>
              <h3 className={cx("aside-h")}>
                {t.yourEdits}
                <span>{v.log.length}</span>
              </h3>
              {v.log.length ? (
                <ol className={cx("log")}>
                  {v.log.map((entry) => (
                    <li key={entry.id}>
                      <div className={cx("log-meta")}>
                        <span
                          className="i-ph-clock-counter-clockwise"
                          aria-hidden="true"
                        />
                        <span>{fmtDate(entry.at, lang)}</span>
                        <span>· {t.pageShort(entry.page)}</span>
                      </div>
                      <ul>
                        {entry.changes.flatMap((c) =>
                          inWords(c, t, lang).map((line) => (
                            <li key={c.id + line}>{line}</li>
                          ))
                        )}
                      </ul>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={cx("aside-p")}>{t.noSaved}</p>
              )}
              <h3 className={cx("aside-h")}>
                {t.unsavedTitle}
                <span>{unsaved}</span>
              </h3>
              {unsaved ? (
                <ChangesList
                  t={t}
                  lang={lang}
                  changes={changes}
                  onFocus={focusChange}
                  onRevert={saving ? undefined : revert}
                />
              ) : (
                <p className={cx("aside-p")}>
                  <span className="i-ph-cloud-check" aria-hidden="true" />
                  {t.allSaved}
                </p>
              )}
              <h3 className={cx("aside-h")}>
                {t.attention}
                <span>0</span>
              </h3>
              <p className={cx("aside-p")}>{t.attentionNone}</p>
            </div>
            <p className={cx("aside-note-foot")}>{t.logFoot}</p>
          </aside>
        ) : editing && (unsaved > 0 || saving) ? (
          <aside className={cx("aside")} aria-label={t.edits}>
            <div className={cx("aside-head")}>
              <h2>
                {t.edits}
                <span>{unsaved}</span>
              </h2>
              <button
                type="button"
                className={cx("btn-ghost", showingSaved && "on")}
                aria-pressed={showingSaved}
                disabled={!!saving || !unsaved}
                title={t.asWasTitle}
                onClick={() => {
                  setTool("SELECT");
                  setSelected(null);
                  closeEditor();
                  setShowingSaved(!showingSaved);
                }}
              >
                <span
                  className={showingSaved ? "i-ph-eye-slash" : "i-ph-eye"}
                  aria-hidden="true"
                />
                {showingSaved ? t.backEdits : t.asWas}
              </button>
            </div>
            {showingSaved && <p className={cx("aside-blue")}>{t.asWasNote}</p>}
            <div className={cx("aside-list")}>
              {unsaved ? (
                <ChangesList
                  t={t}
                  lang={lang}
                  changes={changes}
                  onFocus={focusChange}
                  onRevert={saving ? undefined : revert}
                />
              ) : (
                <p className={cx("aside-p")}>{t.noEdits}</p>
              )}
            </div>
            <div className={cx("aside-foot")}>
              {saving ? (
                <p className={cx("aside-saving")} role="status">
                  <Spin />
                  <span>{t.savingNote(saving.text)}</span>
                </p>
              ) : (
                <p className={cx("aside-hint")}>{t.editsHint}</p>
              )}
              <button
                type="button"
                className={cx("btn", "btn-block")}
                disabled={!!saving || !unsaved}
                onClick={v.onSave}
              >
                {saving ? (
                  <Spin />
                ) : (
                  <span className="i-ph-floppy-disk" aria-hidden="true" />
                )}
                {saving ? t.saving : `${t.save} ${unsaved || ""}`.trim()}
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/* ── the app ── */
export default function TranslatorDemo() {
  const [lang] = useLang();
  const t = DICT[lang];
  const timers = useTimers();
  const [phase, setPhase] = useState<Phase>("empty");
  const [src, setSrc] = useState("auto");
  const [target, setTarget] = useState<Target>(lang);
  const [jobTarget, setJobTarget] = useState<Target>(lang);
  const [others, setOthers] = useState(0);
  const [instr, setInstr] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const [batchAt, setBatchAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [modal, setModal] = useState<null | "help" | "cancel" | "rerun">(null);
  const [toast, setToast] = useState<null | { kind: ToastKind; text: string }>(null);
  const [step, setStep] = useState("compare");
  const [saved, setSaved] = useState<Layer>(EMPTY);
  const [draft, setDraft] = useState<Layer>(EMPTY);
  const [past, setPast] = useState<Layer[]>([]);
  const [future, setFuture] = useState<Layer[]>([]);
  const [log, setLog] = useState<Entry[]>([]);
  const [version, setVersion] = useState(1);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState<null | { page: number; text: string }>(null);
  const startRef = useRef(0);
  const speedRef = useRef(1);
  const toastSeq = useRef(0);

  // the target language follows the site's language until the document is sent
  useEffect(() => {
    if (phase === "empty" || phase === "attached") setTarget(lang);
  }, [lang, phase]);

  // the "server": the running job reports its stage on a timer
  useEffect(() => {
    if (phase !== "processing") return;
    const id = window.setInterval(() => {
      const ms = (Date.now() - startRef.current) * speedRef.current;
      if (ms < TOTAL_MS) {
        setElapsed(ms);
        return;
      }
      setElapsed(TOTAL_MS);
      setPhase("done");
      setFlash(true);
      timers.later(() => setFlash(false), 1450);
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, timers]);

  const changes = useMemo(() => diff(draft, saved, jobTarget), [draft, saved, jobTarget]);

  function showToast(kind: ToastKind, text: string, ms?: number) {
    const seq = ++toastSeq.current;
    setToast({ kind, text });
    if (ms) timers.later(() => toastSeq.current === seq && setToast(null), ms);
  }

  function takeSample() {
    if (phase !== "empty") {
      showToast("info", t.oneSample, 3200);
      return;
    }
    setPhase("attached");
  }

  function runJob() {
    startRef.current = Date.now();
    speedRef.current = reducedMotion() ? 2 : 1;
    setElapsed(0);
    setBatchAt(new Date());
    setDownloaded(false);
    setSaved(EMPTY);
    setDraft(EMPTY);
    setPast([]);
    setFuture([]);
    setLog([]);
    setVersion(1);
    setSavedAt(null);
    setPhase("processing");
  }

  function translate() {
    setJobTarget(target);
    setPhase("uploading");
    timers.later(runJob, 700);
  }

  function restart() {
    timers.clear();
    setPhase("empty");
    setSrc("auto");
    setTarget(lang);
    setOthers(0);
    setInstr("");
    setMoreOpen(false);
    setBatchAt(null);
    setElapsed(0);
    setFlash(false);
    setViewer(false);
    setDownloaded(false);
    setModal(null);
    setToast(null);
    setSaved(EMPTY);
    setDraft(EMPTY);
    setPast([]);
    setFuture([]);
    setLog([]);
    setVersion(1);
    setSavedAt(null);
    setSaving(null);
  }

  function commit(next: Layer) {
    setPast([...past, draft]);
    setFuture([]);
    setDraft(next);
  }
  function undo() {
    if (!past.length) return;
    setFuture([draft, ...future]);
    setDraft(past[past.length - 1]);
    setPast(past.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setPast([...past, draft]);
    setDraft(future[0]);
    setFuture(future.slice(1));
  }

  /** A phrase's new look goes into the draft as what differs from the saved document. */
  function applyUnit(id: string, next: Look) {
    const base = lookOf(id, jobTarget, [saved]);
    const edit: Partial<Look> = {};
    if (next.text !== base.text) edit.text = next.text;
    if (next.size !== base.size) edit.size = next.size;
    if (next.align !== base.align) edit.align = next.align;
    if (next.deleted !== base.deleted) edit.deleted = next.deleted;
    const units = { ...draft.units };
    if (Object.keys(edit).length) units[id] = edit;
    else delete units[id];
    commit({ ...draft, units });
  }

  /** «Сохранить»: only the pages with edits are rebuilt, one after another. */
  function save() {
    if (saving || !changes.length) return;
    const pages = [...new Set(changes.map((c) => c.page))].sort();
    const snapshot = changes;
    const delay = reducedMotion() ? 600 : 1500;
    const run = (i: number) => {
      if (i === pages.length) {
        const at = new Date();
        setSaved(merge(saved, draft));
        setLog((list) => [
          ...list,
          ...pages.map((page) => ({
            id: `${at.getTime()}-${page}`,
            at,
            page,
            changes: snapshot.filter((c) => c.page === page)
          }))
        ]);
        setDraft(EMPTY);
        setPast([]);
        setFuture([]);
        setVersion((n) => n + 1);
        setSavedAt(at);
        setSaving(null);
        showToast("success", t.tSaved(pages.length), 3400);
        return;
      }
      const text = t.sheet(pages[i], i + 1, pages.length);
      setSaving({ page: pages[i], text });
      showToast("loading", t.tSaving(text));
      timers.later(() => run(i + 1), delay);
    };
    run(0);
  }

  function download() {
    setDownloaded(true);
    showToast(
      "success",
      t.tDownloaded(FILE.replace(".pdf", `_${jobTarget}.pdf`), version),
      4200
    );
  }

  const done = phase === "done";
  const processing = phase === "processing";
  const hasBatch = processing || done || phase === "cancelled";
  let stageIdx = 0;
  let acc = 0;
  let pct = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const [, ms, end] = STAGES[i];
    const startPct = i ? STAGES[i - 1][2] : 0;
    if (elapsed < acc + ms || i === STAGES.length - 1) {
      stageIdx = i;
      pct = Math.round(startPct + ((end - startPct) * clamp(elapsed - acc, 0, ms)) / ms);
      break;
    }
    acc += ms;
  }
  if (done) pct = 100;
  const readyPages = done
    ? PAGE_COUNT
    : PAGE_READY_MS.filter((ms) => elapsed >= ms).length;
  const leftSec = Math.ceil((TOTAL_MS - elapsed) / 1000);
  const elapsedSec = Math.floor(elapsed / 1000);

  const coachKey = viewer
    ? step
    : phase === "empty"
      ? "empty"
      : phase === "attached" || phase === "uploading"
        ? "attached"
        : processing
          ? "processing"
          : phase === "cancelled"
            ? "cancelled"
            : downloaded
              ? "downloaded"
              : version > 1
                ? "download"
                : "open";

  const dropzone = (small?: boolean) => (
    <button
      type="button"
      className={cx("drop", small && "drop-sm", drag && "drag")}
      onClick={takeSample}
      onDragOver={(event) => {
        event.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(event) => {
        // the dropped file itself is never read: the demo takes its sample instead
        event.preventDefault();
        setDrag(false);
        takeSample();
      }}
    >
      <span className={`i-ph-cloud-arrow-up ${cx("drop-icon")}`} aria-hidden="true" />
      <span className={cx("drop-title")}>{t.drop}</span>
      <span className={cx("drop-hint")}>{t.dropHint}</span>
    </button>
  );

  const badge = processing
    ? { tone: "processing", label: t.status.processing }
    : done
      ? { tone: "success", label: t.status.done }
      : { tone: "neutral", label: t.status.cancelled };

  return (
    <div className="dm-translator">
      {viewer ? (
        <Viewer
          t={t}
          lang={lang}
          target={jobTarget}
          processing={processing}
          readyPages={readyPages}
          saved={saved}
          draft={draft}
          changes={changes}
          log={log}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          saving={saving}
          savedAt={savedAt}
          version={version}
          commit={commit}
          undo={undo}
          redo={redo}
          applyUnit={applyUnit}
          onSave={save}
          onClose={() => setViewer(false)}
          onStep={setStep}
          toast={showToast}
          later={timers.later}
        />
      ) : (
        <div className={cx("app")}>
          <header className={cx("top")}>
            <span className={cx("brand")} aria-label={t.home} role="img">
              <Logo />
            </span>
            <div className={cx("top-right")}>
              {processing && (
                <div className={cx("active")}>
                  <span className={cx("active-dot")} aria-hidden="true" />
                  <span className={cx("active-name")} title={FILE}>
                    {FILE}
                  </span>
                  <span className={cx("active-left")}>
                    {leftSec > 0 ? t.leftShort(duration(t, leftSec)) : `${pct}%`}
                  </span>
                  <button
                    type="button"
                    className={cx("active-x")}
                    aria-label={t.cancelJob(FILE)}
                    title={t.cancelJob(FILE)}
                    onClick={() => setPhase("cancelled")}
                  >
                    <span className="i-ph-x" aria-hidden="true" />
                    <span className={cx("active-x-text")}>{t.cancel}</span>
                  </button>
                </div>
              )}
              <button
                type="button"
                className={cx("ibtn", "ibtn-lg")}
                aria-label={t.help}
                title={t.help}
                onClick={() => setModal("help")}
              >
                <span className="i-ph-question" aria-hidden="true" />
              </button>
              <div className={cx("user")}>
                <p className={cx("user-name")}>{t.user}</p>
                <IconBtn icon="i-ph-sign-out" label={t.logout} />
              </div>
            </div>
          </header>

          <main className={cx("main")}>
            <div className={cx("col")}>
              {phase === "attached" || phase === "uploading" ? (
                <div className={cx("upload")}>
                  <div className={cx("params")}>
                    <p className={cx("params-title")}>{t.params}</p>
                    <div className={cx("selects")}>
                      <label className={cx("select")}>
                        <span className="i-ph-translate" aria-hidden="true" />
                        <select
                          aria-label={t.srcLang}
                          value={src}
                          onChange={(event) => setSrc(event.target.value)}
                        >
                          <option value="auto">{t.auto}</option>
                          {SOURCE_LANGS.map((l) => (
                            <option key={l} value={l}>
                              {t.langs[l]}
                            </option>
                          ))}
                        </select>
                        <span className="i-ph-caret-down" aria-hidden="true" />
                      </label>
                      <label className={cx("select")}>
                        <span className="i-ph-translate" aria-hidden="true" />
                        <select
                          aria-label={t.dstLang}
                          value={target}
                          onChange={(event) => setTarget(event.target.value as Target)}
                        >
                          {TARGET_LANGS.map((l) => (
                            <option key={l} value={l} disabled={l !== "ru" && l !== "en"}>
                              {t.into(t.langs[l])}
                              {l !== "ru" && l !== "en" ? ` (${t.notInDemo})` : ""}
                            </option>
                          ))}
                        </select>
                        <span className="i-ph-caret-down" aria-hidden="true" />
                      </label>
                    </div>
                  </div>

                  <div className={cx("more-box")}>
                    <button
                      type="button"
                      className={cx("more")}
                      aria-expanded={moreOpen}
                      onClick={() => setMoreOpen(!moreOpen)}
                    >
                      <span
                        className={`i-ph-caret-down ${cx("caret", moreOpen && "flip")}`}
                        aria-hidden="true"
                      />
                      {t.more}
                    </button>
                    {moreOpen && (
                      <div className={cx("more-grid")}>
                        <label className={cx("field")}>
                          <span className={cx("field-k")}>{t.others}</span>
                          <span className={cx("select", "select-full")}>
                            <select
                              aria-label={t.others}
                              value={others}
                              disabled={src === "auto"}
                              onChange={(event) => setOthers(Number(event.target.value))}
                            >
                              {t.otherOpts.map((label, i) => (
                                <option key={label} value={i}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <span className="i-ph-caret-down" aria-hidden="true" />
                          </span>
                          {src === "auto" && (
                            <span className={cx("field-k")}>{t.othersNote}</span>
                          )}
                        </label>
                        <div className={cx("field")}>
                          <span className={cx("field-k")}>{t.example}</span>
                          <span className={cx("file-fake")}>
                            <span className={cx("file-fake-btn")}>{t.exampleBtn}</span>
                            {t.exampleNone}
                          </span>
                        </div>
                        <label className={cx("field", "field-wide")}>
                          <span className={cx("field-k")}>{t.instr}</span>
                          <textarea
                            className={cx("instr")}
                            maxLength={4000}
                            placeholder={t.instrPh}
                            value={instr}
                            onChange={(event) => setInstr(event.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className={cx("files")}>
                    <section className={cx("files-list")} aria-label={t.docs}>
                      <h2 className={cx("files-head")}>
                        {t.docs}
                        <span>1</span>
                      </h2>
                      <div className={cx("attach")}>
                        <span className={cx("attach-icon")} aria-hidden="true">
                          <span className="i-ph-file" />
                        </span>
                        <div className={cx("attach-info")}>
                          <p>{FILE}</p>
                          <p>application/pdf</p>
                        </div>
                        <button
                          type="button"
                          className={cx("attach-x")}
                          aria-label={t.remove}
                          title={t.remove}
                          disabled={phase === "uploading"}
                          onClick={() => setPhase("empty")}
                        >
                          <span className="i-ph-x" aria-hidden="true" />
                        </button>
                      </div>
                      {dropzone(true)}
                    </section>
                    <div className={cx("files-foot")}>
                      <button
                        type="button"
                        className={cx("btn", "btn-lg")}
                        disabled={phase === "uploading"}
                        onClick={translate}
                      >
                        {phase === "uploading" ? (
                          <Spin />
                        ) : (
                          <span className="i-ph-translate" aria-hidden="true" />
                        )}
                        {phase === "uploading" ? t.uploading : t.translate}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {dropzone()}
                  {phase === "empty" && (
                    <p className={cx("sample-row")}>
                      {t.demoFiles}
                      <button
                        type="button"
                        className={cx("pill-btn")}
                        onClick={takeSample}
                      >
                        <span className="i-ph-file-arrow-up" aria-hidden="true" />
                        {t.sample}
                      </button>
                    </p>
                  )}
                </>
              )}

              <section className={cx("journal")} aria-label={t.ready}>
                <h2 className={cx("j-title")}>{t.ready}</h2>
                <div className={cx("j-head")}>
                  <nav className={cx("pill", "pager")} aria-label={t.pager}>
                    <button type="button" disabled aria-label={t.prev}>
                      <span className="i-ph-caret-left" aria-hidden="true" />
                    </button>
                    <span>
                      <b>1</b> {t.of} 1
                    </span>
                    <button type="button" disabled aria-label={t.next}>
                      <span className="i-ph-caret-right" aria-hidden="true" />
                    </button>
                  </nav>
                  <span className={cx("pill", "period")}>
                    <span className="i-ph-calendar-blank" aria-hidden="true" />
                    {t.period}
                  </span>
                </div>
                <div className={cx("j-body")}>
                  <div className={cx("day")}>
                    <h3>{hasBatch ? t.today : t.ready}</h3>
                    <span aria-hidden="true" />
                  </div>
                  {hasBatch && batchAt ? (
                    <article className={cx("card", flash && "flash")}>
                      <div className={cx("card-row")}>
                        <div className={cx("card-main")}>
                          <h3 className={cx("card-title")} title={FILE}>
                            {FILE}
                          </h3>
                          <div className={cx("card-meta")}>
                            <span className={cx("badge", `badge-${badge.tone}`)}>
                              {processing ? (
                                <Spin />
                              ) : done ? (
                                <span className="i-ph-check-circle" aria-hidden="true" />
                              ) : (
                                <span
                                  className="i-ph-warning-circle"
                                  aria-hidden="true"
                                />
                              )}
                              {badge.label}
                            </span>
                            <span className={cx("card-date")}>
                              {fmtDate(batchAt, lang)}
                            </span>
                          </div>
                        </div>
                        <div className={cx("card-actions")}>
                          {phase === "cancelled" ? (
                            <span className={cx("nores")}>{t.noResult}</span>
                          ) : (
                            <IconBtn
                              icon="i-ph-eye"
                              label={t.open}
                              onClick={() => setViewer(true)}
                            />
                          )}
                          <IconBtn
                            icon={downloaded ? "i-ph-check" : "i-ph-download-simple"}
                            label={done ? t.download : t.notYet}
                            disabled={!done}
                            onClick={download}
                          />
                          {!processing && (
                            <IconBtn
                              icon="i-ph-arrow-counter-clockwise"
                              label={t.rerun}
                              onClick={() => (done ? setModal("rerun") : runJob())}
                            />
                          )}
                        </div>
                      </div>
                      {processing && (
                        <div className={cx("tl")}>
                          <div className={cx("tl-row")}>
                            <Spin />
                            <p className={cx("tl-label")} aria-live="polite">
                              {t.stages[STAGES[stageIdx][0]]}
                            </p>
                            {leftSec > 0 ? (
                              <span className={cx("tl-left")}>
                                {t.left(duration(t, leftSec))}
                              </span>
                            ) : (
                              <span className={cx("tl-muted")}>{t.almost}</span>
                            )}
                          </div>
                          <div className={cx("tl-bar-row")}>
                            <span
                              role="progressbar"
                              aria-label={t.progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={pct}
                              className={cx("tl-bar")}
                            >
                              <span style={{ width: `${pct}%` }} />
                            </span>
                            <span className={cx("tl-pct")}>
                              {pct}% · {t.items(readyPages, PAGE_COUNT)}
                            </span>
                          </div>
                          <p className={cx("tl-elapsed")}>
                            {t.running(duration(t, elapsedSec), t.lessMin)}
                          </p>
                          <div className={cx("tl-foot")}>
                            <button
                              type="button"
                              className={cx("tl-cancel")}
                              onClick={() => setModal("cancel")}
                            >
                              <span className="i-ph-x" aria-hidden="true" />
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ) : (
                    <p className={cx("j-empty")}>{t.empty}</p>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>
      )}

      <div className={cx("coach")}>
        <span className={cx("coach-tag")}>{t.demo}</span>
        <p className={cx("coach-text")} aria-live="polite">
          {t.coach[coachKey]}
        </p>
        {phase !== "empty" && (
          <button type="button" className={cx("coach-btn")} onClick={restart}>
            <span className="i-ph-arrow-counter-clockwise" aria-hidden="true" />
            {t.restart}
          </button>
        )}
      </div>

      {toast && (
        <div className={cx("toast", `toast-${toast.kind}`)} role="status">
          {toast.kind === "loading" ? (
            <Spin />
          ) : (
            <span
              className={
                toast.kind === "success" ? "i-ph-check-circle" : "i-ph-warning-circle"
              }
              aria-hidden="true"
            />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {modal && (
        <div
          className={cx("modal")}
          onClick={(event) => event.target === event.currentTarget && setModal(null)}
          onKeyDown={(event) => event.key === "Escape" && setModal(null)}
        >
          {modal === "help" ? (
            <div
              className={cx("dialog", "dialog-wide")}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dmtr-help-title"
            >
              <div className={cx("dialog-close")}>
                <IconBtn
                  icon="i-ph-x"
                  label={t.close}
                  square
                  onClick={() => setModal(null)}
                />
              </div>
              <h2 id="dmtr-help-title" className={cx("help-title")}>
                {t.helpTitle}
              </h2>
              <p className={cx("help-text")}>{t.helpText}</p>
              <div className={cx("help-grid")}>
                {t.helpSteps.map(([title, text], i) => (
                  <article key={title} className={cx("help-card")}>
                    <span className={cx("help-icon")} aria-hidden="true">
                      <span
                        className={
                          [
                            "i-ph-file-arrow-up",
                            "i-ph-translate",
                            "i-ph-magic-wand",
                            "i-ph-download-simple"
                          ][i]
                        }
                      />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={cx("dialog")}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="dmtr-confirm-title"
            >
              <h2 id="dmtr-confirm-title" className={cx("dialog-title")}>
                {modal === "cancel" ? t.cancelQ : t.rerunQ}
              </h2>
              <p className={cx("dialog-text")}>
                {modal === "cancel" ? t.cancelText : t.rerunText(FILE)}
              </p>
              <div className={cx("dialog-foot")}>
                <button
                  type="button"
                  className={cx("btn-outline")}
                  autoFocus
                  onClick={() => setModal(null)}
                >
                  {modal === "cancel" ? t.keepGoing : t.keep}
                </button>
                <button
                  type="button"
                  className={cx("btn", modal === "cancel" && "btn-danger")}
                  onClick={() => {
                    if (modal === "cancel") setPhase("cancelled");
                    else runJob();
                    setModal(null);
                  }}
                >
                  {modal === "cancel" ? t.stop : t.rerun}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
