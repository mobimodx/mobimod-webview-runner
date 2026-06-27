// Single source of truth for the WebView app config — shared by the web builder
// preview AND the Capacitor runner so that "preview = output" is guaranteed.

export type Target = {
  type: "page" | "webview" | "url" | "tel" | "mail" | "whatsapp";
  value: string;
};

export type Block =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; url: string }
  | { id: string; type: "button"; text: string; action: Target }
  | { id: string; type: "spacer"; size: number };

export type Page =
  | { id: string; type: "webview"; title: string; url: string; pull: boolean }
  | { id: string; type: "native"; title: string; blocks: Block[] };

export type NavStyle = "labeled" | "icons" | "pill" | "indicator" | "floating" | "minimal";
export type TopStyle = "minimal" | "centered" | "search" | "large" | "gradient";

export type NavItem = { id: string; label: string; icon: string; target: Target };
export type SideItem = { id: string; label: string; icon: string; target: Target };

export type Cfg = {
  app: { name: string; packageId: string; version: string; iconUrl: string };
  theme: { primary: string; accent: string; bg: string; surface: string; text: string; navStyle: NavStyle };
  topBar: { enabled: boolean; title: string; showLogo: boolean; logoUrl: string; bg: string; text: string; menu: boolean; style?: TopStyle };
  sideMenu: { enabled: boolean; items: SideItem[] };
  bottomNav: { enabled: boolean; items: NavItem[] };
  pages: Page[];
  home: string;
};

export type AppConfig = Cfg;

// Normalised export format (what the runner / GitHub Actions consume).
export function toAppConfig(cfg: Cfg) {
  return {
    schemaVersion: 1,
    app: { ...cfg.app, versionCode: 1, splash: { bg: cfg.theme.primary, logoUrl: cfg.topBar.logoUrl } },
    theme: {
      primary: cfg.theme.primary, accent: cfg.theme.accent, background: cfg.theme.bg,
      surface: cfg.theme.surface, text: cfg.theme.text, bottomNavStyle: cfg.theme.navStyle,
    },
    topBar: cfg.topBar, sideMenu: cfg.sideMenu, bottomNav: cfg.bottomNav, pages: cfg.pages, home: cfg.home,
  };
}
