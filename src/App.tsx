import { useState } from "react";
import { Browser } from "@capacitor/browser";
import { AppShell } from "./shell/AppShell";
import type { Cfg, Page, Target } from "./shell/types";
import raw from "./app-config.json";

// app-config.json is overwritten by scripts/apply-config.mjs at build time with the
// project's config (the SAME Cfg the web builder preview rendered).
const cfg = raw as unknown as Cfg;

export default function App() {
  const [view, setView] = useState<string>(cfg.home);

  // On device, open webview pages / external links via the native in-app browser.
  // (Production: swap to a child WebView plugin to keep the chrome visible.)
  const renderWebview = (page: Extract<Page, { type: "webview" }>) => (
    <div className="as-web">
      <iframe title={page.title} src={page.url} style={{ flex: 1, width: "100%", border: "none" }} />
    </div>
  );

  const onAction = (t: Target) => {
    if (t.type === "url" || t.type === "webview") Browser.open({ url: t.value });
    else if (t.type === "tel") window.location.href = "tel:" + t.value;
    else if (t.type === "mail") window.location.href = "mailto:" + t.value;
    else if (t.type === "whatsapp") Browser.open({ url: "https://wa.me/" + t.value.replace(/[^0-9]/g, "") });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppShell config={cfg} activePage={view} onNavigate={setView} renderWebview={renderWebview} onAction={onAction} />
    </div>
  );
}
