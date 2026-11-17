import { portfolio, openPortfolioApp } from "~/configs/portfolio";
export default function Terminal() {
  const [lines, setLines] = useState<{ command: string; output: string }[]>([]);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);
  function run(e: React.FormEvent) {
    e.preventDefault();
    const input = command.trim();
    if (!input) return;
    setCommand("");
    setHistory((h) => [input, ...h]);
    setHistoryIndex(-1);
    const [cmd, ...args] = input.toLowerCase().split(/\s+/);
    let output = "";
    if (cmd === "clear") {
      setLines([]);
      return;
    }
    switch (cmd) {
      case "help":
        output =
          "about      — обо мне\nprojects   — открыть проекты\ncontact    — контакты\nopen       — open profile | projects | contact | readme\nwhoami     — кто здесь\nls         — файлы рабочего стола\ndate       — текущее время\nclear      — очистить терминал";
        break;
      case "about":
      case "whoami":
        output = `${portfolio.name}\n${portfolio.role}\n\n${portfolio.bio}`;
        break;
      case "projects":
        openPortfolioApp("projects");
        output = "Открываю проекты…";
        break;
      case "contact":
        openPortfolioApp("contact");
        output =
          [portfolio.email, portfolio.github, portfolio.telegram]
            .filter(Boolean)
            .join("\n") || "Раздел контактов ещё заполняется.";
        break;
      case "ls":
        output = "profile.app   projects.app   contact.app   readme.md";
        break;
      case "date":
        output = new Date().toLocaleString("ru-RU");
        break;
      case "pwd":
        output = "/home/yar/portfolio";
        break;
      case "echo":
        output = input.slice(5);
        break;
      case "open":
        if (["profile", "projects", "contact", "readme", "terminal"].includes(args[0])) {
          openPortfolioApp(args[0]);
          output = `Открываю ${args[0]}…`;
        } else {
          output = "Приложение не найдено. Попробуй: open projects";
        }
        break;
      default:
        output = `Команда «${cmd}» не найдена. Введи help.`;
    }
    setLines((l) => [...l, { command: input, output }]);
  }
  return (
    <main className="terminal-app app-scroll">
      <div className="terminal-meta">
        <span>YAR OS [VERSION 1.0]</span>
        <span>zsh</span>
      </div>
      <div className="terminal-banner">
        yar<span>_</span>os
      </div>
      <p className="terminal-welcome">
        {portfolio.name} / {portfolio.role}
        <br />
        <span>Введи help, чтобы начать.</span>
      </p>
      <div aria-live="polite">
        {lines.map((line, i) => (
          <div className="terminal-entry" key={i}>
            <div>
              <span className="terminal-prompt">yar@portfolio ~ % </span>
              {line.command}
            </div>
            <pre>{line.output}</pre>
          </div>
        ))}
      </div>
      <form onSubmit={run} className="terminal-input-row">
        <label htmlFor="terminal-command">yar@portfolio ~ %</label>
        <input
          id="terminal-command"
          aria-label="Команда терминала"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const i = Math.min(historyIndex + 1, history.length - 1);
              setHistoryIndex(i);
              setCommand(history[i] || "");
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const i = Math.max(-1, historyIndex - 1);
              setHistoryIndex(i);
              setCommand(history[i] || "");
            }
          }}
        />
      </form>
      <div ref={bottom} />
    </main>
  );
}
