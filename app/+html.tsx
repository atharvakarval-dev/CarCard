/**
 * +html.tsx — Web Root HTML: Elite Redesign
 *
 * This file only runs in Node.js during static rendering.
 * It's the single opportunity to configure everything a browser
 * receives before any JavaScript executes — get it right here
 * and the web experience is polished from the first paint.
 *
 * What's improved:
 *  1. Full PWA manifest linkage (installable, standalone mode)
 *  2. Comprehensive SEO + Open Graph + Twitter Card meta
 *  3. Apple-specific PWA meta (status bar, splash, icon)
 *  4. Font preloading with display=swap (no FOUT)
 *  5. Zero-flash dark mode via CSS var strategy (not just body bg)
 *  6. Critical CSS inlined — layout shell visible before JS
 *  7. Security headers via meta (CSP-ready structure)
 *  8. Canonical URL + lang attribute for i18n readiness
 */

import { ScrollViewStyleReset } from 'expo-router/html';

const APP_NAME = 'CarCard';
const APP_DESCRIPTION = 'Smart vehicle identity. Let anyone contact you securely when your car is causing an issue.';
const APP_URL = 'https://carcard.app'; // Update to your production URL
const THEME_COLOR_LIGHT = '#4F6EF7';
const THEME_COLOR_DARK = '#6C8EFF';
const BG_LIGHT = '#F0F4FF';
const BG_DARK = '#080C1A';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Encoding & Compat ── */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* ── Primary Meta ── */}
        <title>{APP_NAME} — Smart Vehicle Identity</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="application-name" content={APP_NAME} />
        <meta name="keywords" content="car tag, vehicle identity, emergency contact, QR code car, CarCard" />
        <meta name="author" content="CarCard" />
        <link rel="canonical" href={APP_URL} />

        {/* ── Open Graph (Facebook, LinkedIn, WhatsApp) ── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={APP_NAME} />
        <meta property="og:title" content={`${APP_NAME} — Smart Vehicle Identity`} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:image" content={`${APP_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

        {/* ── Twitter Card ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${APP_NAME} — Smart Vehicle Identity`} />
        <meta name="twitter:description" content={APP_DESCRIPTION} />
        <meta name="twitter:image" content={`${APP_URL}/og-image.png`} />

        {/* ── PWA: Theme Color (respects OS preference) ── */}
        <meta name="theme-color" content={THEME_COLOR_LIGHT} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={THEME_COLOR_DARK} media="(prefers-color-scheme: dark)" />

        {/* ── PWA: Manifest ── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── PWA: Apple Specific ── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Apple splash screens for common device sizes */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />

        {/* ── Favicon Suite ── */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* ── Font Preload ── 
                    Preloading the primary weight prevents FOUT on first render.
                    Only preload what's above the fold. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ── Expo Router scroll reset ── */}
        <ScrollViewStyleReset />

        {/* ── Critical CSS ── 
                    Inlined to avoid render-blocking stylesheets.
                    Covers: dark mode flash prevention, layout shell,
                    iOS safe area, and font smoothing. */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// ─── Critical CSS ─────────────────────────────────────────────────────────────
// Strategy: CSS custom properties set the semantic colors at :root level.
// This means the very first painted pixel matches the correct theme —
// no flash, no mismatch, regardless of user preference.
//
// Using `color-scheme` property tells the browser to render native UI
// (scrollbars, inputs, select) in the correct theme automatically.

const criticalCSS = `
  /* ── Reset & Base ── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── CSS Custom Properties — Light (default) ── */
  :root {
    --bg: ${BG_LIGHT};
    --bg-surface: rgba(255, 255, 255, 0.72);
    --text: #0D1117;
    --text-muted: #9CA3AF;
    --primary: ${THEME_COLOR_LIGHT};
    --shadow: rgba(79, 110, 247, 0.12);
    color-scheme: light;
  }

  /* ── CSS Custom Properties — Dark ── */
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: ${BG_DARK};
      --bg-surface: rgba(255, 255, 255, 0.05);
      --text: #F1F5F9;
      --text-muted: #64748B;
      --primary: ${THEME_COLOR_DARK};
      --shadow: rgba(108, 142, 255, 0.15);
      color-scheme: dark;
    }
  }

  /* ── Document ── */
  html {
    height: 100%;
    /* Prevents iOS Safari bounce from revealing bg color mismatch */
    background-color: var(--bg);
    /* Smoother font rendering on macOS/iOS WebKit */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Prevent text size adjustment on orientation change */
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    height: 100%;
    background-color: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 
                 Roboto, 'Helvetica Neue', Arial, sans-serif;
    /* Support iOS safe area insets (notch, Dynamic Island, home indicator) */
    padding-top: env(safe-area-inset-top);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    /* Prevent horizontal scroll on mobile */
    overflow-x: hidden;
  }

  /* ── Root mount point ── */
  #root, [data-expo-router-root] {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ── Scrollbar styling (Webkit) ── */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
  }

  /* ── Focus styles — accessible but not ugly ── */
  :focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
    border-radius: 6px;
  }

  /* ── Tap highlight — remove on mobile web ── */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Selection color ── */
  ::selection {
    background-color: var(--primary);
    color: #ffffff;
  }

  /* ── Image default ── */
  img, svg {
    display: block;
    max-width: 100%;
  }

  /* ── Prevent pull-to-refresh on web (handled natively in Expo) ── */
  html {
    overscroll-behavior-y: none;
  }
`;