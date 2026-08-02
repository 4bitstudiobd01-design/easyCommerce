'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

interface StorefrontPixelTrackerProps {
  facebookPixelId?: string;
  tiktokPixelId?: string;
  googleTagManagerId?: string;
  googleAnalyticsId?: string;
  snapchatPixelId?: string;
  pinterestTagId?: string;
}

export function StorefrontPixelTracker({
  facebookPixelId,
  tiktokPixelId,
  googleTagManagerId,
  googleAnalyticsId,
  snapchatPixelId,
  pinterestTagId,
}: StorefrontPixelTrackerProps) {
  useEffect(() => {
    // Meta / Facebook Pixel PageView
    if (facebookPixelId && typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }

    // TikTok Pixel PageView
    if (tiktokPixelId && typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.page();
    }

    // Snapchat Pixel PageView
    if (snapchatPixelId && typeof window !== 'undefined' && (window as any).snaptr) {
      (window as any).snaptr('track', 'PAGE_VIEW');
    }

    // Pinterest Tag PageView
    if (pinterestTagId && typeof window !== 'undefined' && (window as any).pintrk) {
      (window as any).pintrk('page');
    }
  }, [facebookPixelId, tiktokPixelId, snapchatPixelId, pinterestTagId]);

  return (
    <>
      {/* 🔵 META / FACEBOOK PIXEL SCRIPT */}
      {facebookPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* 🎵 TIKTOK PIXEL SCRIPT */}
      {tiktokPixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject = t;var ttq = w[t] = w[t] || [];ttq.methods = ["page","track","attach","once","on","off","add","set","remove","init","instance","debug","on","off"],ttq.setAndDefer = function (t, e) {t[e] = function () {t.push([e].concat(Array.prototype.slice.call(arguments, 0)))}};for (var i = 0; i < ttq.methods.length; i++)ttq.setAndDefer(ttq, ttq.methods[i]);ttq.instance = function (t) {for (var e = ttq.methods, n = 0; n < e.length; n++)ttq.setAndDefer(t, e[n]);return t},ttq.load = function (e, n) {var i = "https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i = ttq._i || {},ttq._i[e] = [],ttq._i[e]._u = i,ttq._t = ttq._t || {},ttq._t[e] = +new Date,ttq._o = ttq._o || {},ttq._o[e] = n || {};var o = document.createElement("script");o.type = "text/javascript",o.async = !0,o.src = i + "?sdkid=" + e + "&lib=" + t;var a = document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o, a)};
                ttq.load('${tiktokPixelId}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}

      {/* 🏷️ GOOGLE TAG MANAGER (GTM) SCRIPT */}
      {googleTagManagerId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `,
          }}
        />
      )}

      {/* 📊 GOOGLE ANALYTICS 4 (GA4) SCRIPT */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `,
            }}
          />
        </>
      )}

      {/* 👻 SNAPCHAT PIXEL SCRIPT */}
      {snapchatPixelId && (
        <Script
          id="snapchat-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
              {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
              a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
              r.src=n;var u=t.getElementsByTagName(s)[0];
              u.parentNode.insertBefore(r,u);})(window,document,
              'https://sc-static.net/scevent.min.js');
              snaptr('init', '${snapchatPixelId}');
              snaptr('track', 'PAGE_VIEW');
            `,
          }}
        />
      )}

      {/* 📌 PINTEREST TAG SCRIPT */}
      {pinterestTagId && (
        <Script
          id="pinterest-tag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(e){if(!window.pintrk){window.pintrk = function () {
              window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
              n=window.pintrk;n.queue=[],n.version="3.0";var
              t=document.createElement("script");t.async=!0,t.src=e;var
              r=document.getElementsByTagName("script")[0];
              r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
              pintrk('load', '${pinterestTagId}');
              pintrk('page');
            `,
          }}
        />
      )}
    </>
  );
}
