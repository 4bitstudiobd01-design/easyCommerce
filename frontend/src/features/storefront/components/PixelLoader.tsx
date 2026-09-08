'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { resolvePixelFires, type PreviewRule } from '@/features/marketing/utils/pixelFires';
import { resolvePageType, toStorefrontPath } from '../utils/pageType';
import { readStoredAttribution, readStoredSessionId } from '../utils/attribution';

interface StorefrontPixel {
  id: string;
  provider: 'META' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK';
  pixelId: string;
  pageScopeMode: 'ALL' | 'RULES';
  pageRules: PreviewRule[];
}

interface StorefrontPixelsResponse {
  pixels: StorefrontPixel[];
  eventConfig: Record<string, boolean>;
}

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/orders'
).replace(/\/(orders|payments|logistics)$/, '');

/** Standard event to fire on first load of each page type (PageView is fired everywhere). */
const PAGE_TYPE_EVENT: Record<string, string | null> = {
  HOME: null,
  PRODUCT: 'ViewContent',
  COLLECTION: null,
  CATEGORY: null,
  CART: null,
  CHECKOUT: 'InitiateCheckout',
  THANK_YOU: 'Purchase',
  SEARCH: null,
  BLOG: null,
  OTHER: null,
};

function eventEnabled(cfg: Record<string, boolean>, name: string): boolean {
  return cfg[name] !== false; // missing = on
}

/** Fire a provider's browser pixel for one event. */
function fireBrowserEvent(pixel: StorefrontPixel, eventName: string) {
  const w = window as any;
  try {
    if (pixel.provider === 'META' && w.fbq) {
      w.fbq('trackSingle', pixel.pixelId, eventName);
    } else if (pixel.provider === 'TIKTOK' && w.ttq) {
      if (eventName === 'PageView') w.ttq.page();
      else w.ttq.track(eventName);
    } else if (pixel.provider === 'GOOGLE_ANALYTICS' && typeof w.gtag === 'function') {
      w.gtag('event', eventName === 'PageView' ? 'page_view' : eventName, {
        send_to: pixel.pixelId,
      });
    } else if (pixel.provider === 'GOOGLE_ADS' && typeof w.gtag === 'function') {
      w.gtag('event', 'conversion', { send_to: pixel.pixelId });
    }
  } catch {
    /* a pixel that isn't ready yet must never break the page */
  }
}

/** Best-effort beacon so the backend has a BROWSER event-log row. */
function beacon(slug: string, pixelId: string, eventName: string, pagePath: string) {
  const attribution = readStoredAttribution();
  const body = JSON.stringify({
    storeSlug: slug,
    pixelId,
    eventName,
    pagePath,
    sessionId: readStoredSessionId() || undefined,
    utmSource: attribution?.utmSource,
  });
  const url = `${API_ROOT}/marketing/events/ingest`;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(
        () => {},
      );
    }
  } catch {
    /* ignore */
  }
}

interface PixelLoaderProps {
  slug: string;
}

/**
 * Single storefront-wide pixel runtime. Replaces the per-page `StorefrontPixelTracker`
 * — mount it once in the storefront layout.
 *
 *  1. fetches the store's active pixels + page rules once,
 *  2. injects each provider's base script only when at least one of its pixels
 *     should fire on the current page,
 *  3. on every page view, fires `PageView` (+ the page-type-specific event) through
 *     each pixel whose rules allow this page and whose event is enabled store-wide,
 *  4. beacons each fire to the backend event log.
 */
export function PixelLoader({ slug }: PixelLoaderProps) {
  const pathname = usePathname() || '/';
  const [data, setData] = useState<StorefrontPixelsResponse | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  // Fetch once per slug.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_ROOT}/storefront/${slug}/pixels`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        setData(json.data ?? json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const storefrontPath = toStorefrontPath(pathname, slug);
  const pageType = resolvePageType(storefrontPath);

  // Which pixels should fire on this page?
  const activeForPage =
    data?.pixels.filter((p) =>
      resolvePixelFires(p.pageScopeMode, p.pageRules, {
        pathname: storefrontPath,
        pageType,
      }),
    ) ?? [];

  const providersToLoad = new Set(activeForPage.map((p) => p.provider));

  // Fire events on each navigation (once per path+event).
  useEffect(() => {
    if (!data || activeForPage.length === 0) return;
    const cfg = data.eventConfig;

    const run = () => {
      const eventsForPage: string[] = ['PageView'];
      const extra = PAGE_TYPE_EVENT[pageType];
      if (extra) eventsForPage.push(extra);

      for (const eventName of eventsForPage) {
        if (!eventEnabled(cfg, eventName)) continue;
        for (const pixel of activeForPage) {
          const key = `${storefrontPath}::${pixel.id}::${eventName}`;
          if (firedRef.current.has(key)) continue;
          firedRef.current.add(key);
          fireBrowserEvent(pixel, eventName);
          beacon(slug, pixel.id, eventName, storefrontPath);
        }
      }
    };

    // Small delay so provider base scripts have a chance to define fbq/ttq/gtag.
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, storefrontPath, pageType]);

  return (
    <>
      {providersToLoad.has('META') &&
        activeForPage
          .filter((p) => p.provider === 'META')
          .slice(0, 1)
          .map((p) => (
            <Script
              key="fb-pixel-base"
              id="fb-pixel-base"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${p.pixelId}');`,
              }}
            />
          ))}

      {providersToLoad.has('TIKTOK') &&
        activeForPage
          .filter((p) => p.provider === 'TIKTOK')
          .slice(0, 1)
          .map((p) => (
            <Script
              key="tiktok-pixel-base"
              id="tiktok-pixel-base"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${p.pixelId}');}(window,document,'ttq');`,
              }}
            />
          ))}

      {providersToLoad.has('GOOGLE_ANALYTICS') &&
        activeForPage
          .filter((p) => p.provider === 'GOOGLE_ANALYTICS')
          .slice(0, 1)
          .map((p) => (
            <Script key="ga4-base" id="ga4-base" strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${p.pixelId}`}
            />
          ))}
      {providersToLoad.has('GOOGLE_ANALYTICS') && (
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${activeForPage
              .filter((p) => p.provider === 'GOOGLE_ANALYTICS' || p.provider === 'GOOGLE_ADS')
              .map((p) => `gtag('config','${p.pixelId}');`)
              .join('')}`,
          }}
        />
      )}

      {providersToLoad.has('GOOGLE_ADS') && !providersToLoad.has('GOOGLE_ANALYTICS') &&
        activeForPage
          .filter((p) => p.provider === 'GOOGLE_ADS')
          .slice(0, 1)
          .map((p) => (
            <Script key="gads-base" id="gads-base" strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${p.pixelId}`}
            />
          ))}
      {providersToLoad.has('GOOGLE_ADS') && !providersToLoad.has('GOOGLE_ANALYTICS') && (
        <Script
          id="gads-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${activeForPage
              .filter((p) => p.provider === 'GOOGLE_ADS')
              .map((p) => `gtag('config','${p.pixelId}');`)
              .join('')}`,
          }}
        />
      )}
    </>
  );
}
