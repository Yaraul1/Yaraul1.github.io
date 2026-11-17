# Yar OS

Персональное портфолио **Yaroslav Yuferev · AI Engineer** в формате рабочего стола.
Основа — [Renovamen/playground-macos](https://github.com/Renovamen/playground-macos), MIT. Авторская лицензия сохранена в `LICENSE`.

## Запуск

Требуются Node.js и pnpm (версия указана в `package.json`).

```sh
pnpm install
pnpm dev
```

## Содержание

Данные редактируются в **`src/configs/portfolio.ts`**:

- `name`, `role`, `bio` — профиль;
- `email` — адрес электронной почты;
- `github`, `telegram` — полные ссылки с `https://`;
- `projects` — список проектов; пустой список показывает состояние «раздел готовится».

Пример структуры проекта (демонстрационные данные, заменить реальными):

```ts
{
  title: "Название проекта",
  category: "AI / AUTOMATION",
  description: "Задача, твоя роль и результат.",
  tags: ["Python", "React"],
  url: "https://example.com",
  source: "https://github.com/your-account/project"
}
```

Проекты и контакты пока не заполнены: вымышленных работ и ссылок в интерфейсе нет.
Оформление использует системный шрифт macOS (San Francisco), оригинальные иконки Apple и обои Mac Purple. Источники перечислены в `public/ASSETS.md`.

Иконки, обои и цвета — `public/icons/`, `public/wallpapers/` и `src/styles/portfolio.css`. Приложения — `src/configs/apps.tsx`.

## Возможности

- Открытие, перемещение, изменение размера, сворачивание и закрытие окон.
- Док с увеличением иконок, ярлыки рабочего стола и поиск (`⌘/Ctrl + K`).
- Терминал: `help`, `about`, `whoami`, `projects`, `contact`, `open`, `ls`, `pwd`, `date`, `echo`, `clear`; история через стрелки.
- Мобильная компоновка с окнами на ширину экрана.
- Короткая загрузка при первом посещении за сессию; поддержка reduced motion.
- Аналитика и внешние медиа исходного шаблона удалены.

## Проверка и сборка

```sh
pnpm typecheck
pnpm build
pnpm serve
```

Результат — статическая папка `dist/`. Для хостинга можно использовать Sites, Vercel, Netlify или любой статический сервер. Настройки Sites сохранены в `.openai/hosting.json`.
