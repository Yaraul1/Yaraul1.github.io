import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";

SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("php", php);

const languageName: Record<string, string> = {
  python: "Python",
  typescript: "TypeScript",
  tsx: "TypeScript · React",
  javascript: "JavaScript",
  php: "PHP"
};

/** Code fragment; token colours come from CSS so they follow the theme. */
export default function CodeBlock({
  code,
  language,
  path
}: {
  code: string;
  language: string;
  path: string;
}) {
  return (
    <figure className="lh-code">
      <figcaption>
        <span className="lh-code-path">{path}</span>
        <span>{languageName[language] || language}</span>
      </figcaption>
      <SyntaxHighlighter
        language={language}
        useInlineStyles={false}
        showLineNumbers
        lineNumberStyle={{}}
        PreTag="pre"
        codeTagProps={{ className: `language-${language}` }}
      >
        {code}
      </SyntaxHighlighter>
    </figure>
  );
}
