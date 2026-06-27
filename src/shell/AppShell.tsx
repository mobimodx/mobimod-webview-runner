"use client";

// THE shared renderer. Web builder preview AND the Capacitor runner both render
// the app through this component, from the same Cfg. => preview == output.
import React, { useState } from "react";
import { Cfg, Page, Target } from "./types";
import { Icon } from "./icons";

export type AppShellProps = {
  config: Cfg;
  activePage: string;
  onNavigate?: (pageId: string) => void;
  renderWebview?: (page: Extract<Page, { type: "webview" }>) => React.ReactNode;
  onAction?: (target: Target) => void;
};

function hexToRgba(hex: string, a: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return `rgba(37,99,235,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function defaultAction(t: Target) {
  if (typeof window === "undefined") return;
  if (t.type === "url" || t.type === "webview") window.open(t.value, "_blank");
  else if (t.type === "tel") window.location.href = "tel:" + t.value;
  else if (t.type === "mail") window.location.href = "mailto:" + t.value;
  else if (t.type === "whatsapp") window.open("https://wa.me/" + t.value.replace(/[^0-9]/g, ""), "_blank");
}

export function AppShell({ config: cfg, activePage, onNavigate, renderWebview, onAction }: AppShellProps) {
  const [sideOpen, setSideOpen] = useState(false);
  const page = cfg.pages.find((p) => p.id === activePage) || cfg.pages[0];
  const act = onAction || defaultAction;
  const tStyle = cfg.topBar.style || "centered";
  const nStyle = cfg.theme.navStyle || "labeled";
  const showLabel = nStyle !== "icons" && nStyle !== "minimal";

  const go = (t: Target) => {
    if (t.type === "page" && cfg.pages.some((p) => p.id === t.value)) onNavigate?.(t.value);
    else act(t);
  };

  const topBg = tStyle === "gradient" ? `linear-gradient(120deg, ${cfg.theme.primary}, ${cfg.theme.accent})` : cfg.topBar.bg;
  const topText = tStyle === "gradient" ? "#ffffff" : cfg.topBar.text;
  const rootStyle = {
    background: cfg.theme.bg, color: cfg.theme.text,
    ["--p" as string]: cfg.theme.primary,
    ["--ac" as string]: cfg.theme.accent,
    ["--pt" as string]: hexToRgba(cfg.theme.primary, 0.14),
    ["--ptb" as string]: hexToRgba(cfg.theme.primary, 0.10),
  } as React.CSSProperties;

  return (
    <div className="as-root" style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: AS_CSS }} />

      {cfg.topBar.enabled && (
        <div className={"as-top as-top--" + tStyle} style={{ background: topBg, color: topText }}>
          <div className="as-top-row">
            {cfg.topBar.menu && cfg.sideMenu.enabled ? (
              <button className="as-ic" onClick={() => setSideOpen(true)} style={{ color: topText }} aria-label="Menü"><Icon name="menu" size={20} /></button>
            ) : <span className="as-ic-sp" />}
            <div className="as-title">{cfg.topBar.showLogo && cfg.topBar.logoUrl ? <img src={cfg.topBar.logoUrl} alt="" /> : cfg.topBar.title}</div>
            <button className="as-ic" style={{ color: topText }} aria-label="Bildirim"><span className="as-dot" />{<Icon name="bell" size={19} />}</button>
          </div>
          {tStyle === "search" && (
            <div className="as-search"><Icon name="search" size={15} /><input readOnly placeholder="Ara…" /></div>
          )}
          {tStyle === "large" && <div className="as-large">{cfg.topBar.title}</div>}
        </div>
      )}

      <div className="as-body" style={{ background: cfg.theme.bg }}>
        {page && page.type === "webview" ? (
          renderWebview ? renderWebview(page) : (
            <div className="as-web">
              <div className="as-web-url"><Icon name="info" size={12} />{page.url}</div>
              <iframe title={page.title} src={page.url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </div>
          )
        ) : page ? (
          <div className="as-native">
            {page.blocks.map((b) => {
              if (b.type === "heading") return <h2 key={b.id} style={{ color: cfg.theme.text }}>{b.text}</h2>;
              if (b.type === "text") return <p key={b.id} style={{ color: cfg.theme.text }}>{b.text}</p>;
              if (b.type === "image") return <div key={b.id} className="as-img" style={{ background: cfg.theme.surface }}>{b.url ? <img src={b.url} alt="" /> : <span>Görsel</span>}</div>;
              if (b.type === "spacer") return <div key={b.id} style={{ height: b.size }} />;
              return <button key={b.id} className="as-nbtn" style={{ background: cfg.theme.primary }} onClick={() => go(b.action)}>{b.text}</button>;
            })}
            {page.blocks.length === 0 && <div className="as-empty">Boş sayfa</div>}
          </div>
        ) : null}
      </div>

      {cfg.bottomNav.enabled && (
        <div className={"as-nav as-nav--" + nStyle}>
          {cfg.bottomNav.items.map((it) => {
            const on = it.target.type === "page" && it.target.value === activePage;
            return (
              <button key={it.id} className={"as-tab" + (on ? " on" : "")} style={on ? { color: cfg.theme.primary } : undefined} onClick={() => go(it.target)}>
                <span className="as-tab-ic"><Icon name={it.icon} size={20} /></span>
                {showLabel && <span className="as-tab-l">{it.label}</span>}
              </button>
            );
          })}
        </div>
      )}

      {sideOpen && cfg.sideMenu.enabled && (
        <div className="as-drawer-wrap" onClick={() => setSideOpen(false)}>
          <div className="as-drawer" style={{ background: cfg.theme.bg }} onClick={(e) => e.stopPropagation()}>
            <div className="as-drawer-h" style={{ background: `linear-gradient(120deg, ${cfg.theme.primary}, ${cfg.theme.accent})` }}>
              {cfg.topBar.showLogo && cfg.topBar.logoUrl ? <img src={cfg.topBar.logoUrl} alt="" /> : cfg.app.name}
            </div>
            {cfg.sideMenu.items.map((it) => (
              <button key={it.id} className="as-drawer-i" style={{ color: cfg.theme.text }} onClick={() => { go(it.target); setSideOpen(false); }}>
                <span className="as-drawer-ic"><Icon name={it.icon} size={18} /></span>{it.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const AS_CSS = `
.as-root{height:100%;display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif}
.as-root *{box-sizing:border-box}
/* ---- top bar ---- */
.as-top{flex-shrink:0;z-index:3;position:relative}
.as-top-row{display:flex;align-items:center;gap:8px;padding:13px 14px}
.as-ic{position:relative;border:none;background:none;display:flex;padding:3px;cursor:pointer;border-radius:9px;transition:background .15s}
.as-ic:active{background:rgba(127,127,127,.14)}
.as-ic-sp{width:26px;display:inline-block}
.as-dot{position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:#ef4444;border:1.5px solid #fff}
.as-title{flex:1;font-weight:800;font-size:1.02rem;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.as-title img{height:24px;vertical-align:middle}
.as-top--centered .as-title,.as-top--gradient .as-title{text-align:center}
.as-top--minimal .as-title{text-align:left}
.as-top--minimal,.as-top--centered{box-shadow:0 1px 0 rgba(0,0,0,.06)}
.as-top--gradient{box-shadow:0 6px 18px -10px rgba(0,0,0,.4)}
.as-top--large .as-top-row .as-title{opacity:0;height:0}
.as-large{padding:0 18px 16px;font-size:1.7rem;font-weight:800;letter-spacing:-.03em}
.as-search{margin:0 14px 12px;display:flex;align-items:center;gap:8px;background:rgba(127,127,127,.12);border-radius:11px;padding:9px 13px}
.as-search input{flex:1;border:none;background:none;outline:none;font:inherit;font-size:.85rem;color:inherit}
.as-search input::placeholder{color:currentColor;opacity:.55}
/* ---- body ---- */
.as-body{flex:1;overflow-y:auto;position:relative;min-height:0}
.as-web{height:100%;display:flex;flex-direction:column}
.as-web-url{display:flex;align-items:center;gap:6px;font-size:.68rem;color:#64748b;background:#f1f5f9;padding:7px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.as-web iframe{flex:1;width:100%;border:none;background:#fff}
.as-native{padding:20px 18px;display:flex;flex-direction:column;gap:12px;min-height:100%}
.as-native h2{margin:0;font-size:1.3rem;font-weight:800;letter-spacing:-.02em}
.as-native p{margin:0;font-size:.92rem;line-height:1.55;opacity:.85}
.as-nbtn{border:none;color:#fff;border-radius:12px;padding:13px;font-weight:700;font-size:.92rem;cursor:pointer;box-shadow:0 8px 18px -10px var(--p)}
.as-img{border-radius:12px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.85rem;overflow:hidden}
.as-img img{width:100%;height:100%;object-fit:cover}
.as-empty{color:#94a3b8;font-size:.85rem;text-align:center;padding:40px 0}
/* ---- bottom nav (variants) ---- */
.as-nav{display:flex;flex-shrink:0;background:#fff;position:relative}
.as-tab{flex:1;border:none;background:none;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 10px;color:#9aa6b8;font-size:.66rem;font-weight:600;cursor:pointer;position:relative;transition:color .18s}
.as-tab-ic{display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s,transform .2s,padding .2s}
.as-tab.on{color:var(--p)}
/* labeled (default) */
.as-nav--labeled{border-top:1px solid rgba(0,0,0,.07)}
/* icons only */
.as-nav--icons{border-top:1px solid rgba(0,0,0,.07)}
.as-nav--icons .as-tab{padding:13px 4px}
/* minimal */
.as-nav--minimal{border-top:1px solid rgba(0,0,0,.06)}
.as-nav--minimal .as-tab{padding:14px 4px}
.as-nav--minimal .as-tab.on::after{content:"";position:absolute;bottom:8px;width:5px;height:5px;border-radius:50%;background:var(--p)}
/* pill (Material 3) */
.as-nav--pill{border-top:1px solid rgba(0,0,0,.07);padding:6px 6px 8px}
.as-nav--pill .as-tab.on .as-tab-ic{background:var(--p);color:#fff;padding:5px 16px;border-radius:16px}
.as-nav--pill .as-tab .as-tab-ic{padding:5px 16px;border-radius:16px}
/* indicator (top bar on active) */
.as-nav--indicator{border-top:1px solid rgba(0,0,0,.07)}
.as-nav--indicator .as-tab.on::before{content:"";position:absolute;top:0;width:42%;height:3px;border-radius:0 0 4px 4px;background:var(--p)}
.as-nav--indicator .as-tab.on .as-tab-ic{transform:translateY(-1px)}
/* floating */
.as-nav--floating{margin:0 14px 14px;border-radius:20px;background:#fff;box-shadow:0 12px 30px -12px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.04);padding:6px}
.as-nav--floating .as-tab{border-radius:14px;padding:9px 4px}
.as-nav--floating .as-tab.on{background:var(--pt)}
/* ---- drawer ---- */
.as-drawer-wrap{position:absolute;inset:0;background:rgba(8,15,28,.42);z-index:5;display:flex;backdrop-filter:blur(1px)}
.as-drawer{width:76%;max-width:300px;height:100%;box-shadow:8px 0 40px rgba(0,0,0,.3);display:flex;flex-direction:column;animation:asslide .24s cubic-bezier(.2,.7,.2,1)}
@keyframes asslide{from{transform:translateX(-100%)}to{transform:none}}
.as-drawer-h{color:#fff;font-weight:800;padding:26px 18px;font-size:1.1rem;letter-spacing:-.01em}
.as-drawer-h img{height:28px}
.as-drawer-i{display:flex;align-items:center;gap:13px;border:none;background:none;padding:14px 18px;font-size:.94rem;font-weight:600;text-align:left;cursor:pointer;transition:background .15s}
.as-drawer-i:active{background:rgba(127,127,127,.1)}
.as-drawer-ic{display:flex;color:var(--p)}
`;
