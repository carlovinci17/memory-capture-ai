// RouteChangeTracker.tsx — pushes a virtual-pageview event to GTM's dataLayer on
// every in-app navigation. This is a client-side-routed SPA: GTM's own script
// only fires its default pageview once, on the initial gtm.js load, so nothing
// currently tells Google Analytics a visitor ever left the first page they
// landed on. Mounted once at the top of the tree (inside BrowserRouter, above
// the auth gate) so it fires for every route, including onboarding/sign-in
// screens that render before the main app shell.
//
// This only pushes the event — it still needs a matching trigger in the GTM
// container (Custom Event trigger, event name "virtual_pageview") wired to a
// GA4 tag before Google Analytics actually receives it. See README.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function RouteChangeTracker() {
  const location = useLocation();

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'virtual_pageview',
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}
