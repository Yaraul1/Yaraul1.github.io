import React from "react";
import { createRoot } from "react-dom/client";
import Desktop from "~/pages/Desktop";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/index.css";
import "~/styles/portfolio.css";
function App() {
  const [booting, setBooting] = useState(() => !sessionStorage.getItem("yar-visited"));
  useEffect(() => {
    const timer = setTimeout(() => {
      setBooting(false);
      sessionStorage.setItem("yar-visited", "1");
    }, 1100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <Desktop />
      {booting && (
        <div className="yar-boot" role="status">
          <div>
            yar<span>_</span>os
          </div>
          <p>INITIALIZING PERSONAL SPACE</p>
          <span className="boot-progress" />
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
