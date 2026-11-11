import { ADS_CONSENT_KEY } from '@/lib/utils/consent';

/**
 * Meta's base code, restructured so that nothing reaches Meta before the visitor accepts
 * advertising cookies: the `fbq` queue and `init` are set up right away, but fbevents.js is
 * injected and the page view tracked only by `loadMetaPixel`, which `updateAdsConsent` also calls
 * on consent. The <noscript> image from Meta's snippet is left out, because it can't check consent.
 */
export function getMetaPixelScript(pixelId: string): string {
  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];

  var loaded=false;
  f.loadMetaPixel=function(){
    if(loaded)return;
    loaded=true;
    t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s);
    n('track','PageView');
  };
  n('init',${JSON.stringify(pixelId)});
  if(b.cookie.indexOf('${ADS_CONSENT_KEY}=granted')!==-1)f.loadMetaPixel();
}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
`;
}
