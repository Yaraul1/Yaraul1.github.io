import { portfolio, openPortfolioApp } from "~/configs/portfolio";
import { filledSocials } from "~/configs/socials";
import { useLang, useT } from "~/i18n/useLang";
import { locale } from "~/i18n/lang";
import { ui } from "~/i18n/ui";
export default function Terminal() {
  const t = useT();
  const [lang, setLang] = useLang();
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
        output = t.terminal.help;
        break;
      case "about":
      case "whoami":
        output = `${portfolio.name}\n${portfolio.role}\n\n${portfolio.bio[lang]}`;
        break;
      case "projects":
        openPortfolioApp("projects");
        output = t.terminal.openingProjects;
        break;
      case "contact":
        openPortfolioApp("contact");
        output =
          [
            portfolio.email,
            ...filledSocials().map((s) => `${s.name}: ${portfolio.socials[s.id]}`)
          ]
            .filter(Boolean)
            .join("\n") || t.terminal.contactsPending;
        break;
      case "ls":
        output = "profile.app   projects.app   contact.app   readme.md";
        break;
      case "date":
        output = new Date().toLocaleString(locale(lang));
        break;
      case "pwd":
        output = "/home/yar/portfolio";
        break;
      case "echo":
        output = input.slice(5);
        break;
      case "open":
        if (
          ["profile", "projects", "assistant", "contact", "readme", "terminal"].includes(
            args[0]
          )
        ) {
          openPortfolioApp(args[0]);
          output = t.terminal.opening(args[0]);
        } else {
          output = t.terminal.noApp;
        }
        break;
      case "lang":
        if (args[0] === "ru" || args[0] === "en") {
          setLang(args[0]);
          output = ui[args[0]].terminal.langSet; // confirm in the new language
        } else output = t.terminal.langUsage;
        break;
      default:
        output = t.terminal.notFound(cmd);
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
        <span>{t.terminal.welcome}</span>
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
          aria-label={t.terminal.command}
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
