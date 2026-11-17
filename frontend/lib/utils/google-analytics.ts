import { COOKIE_CONSENT_KEY } from '@/lib/utils/consent';

// About 13 months instead of GA4's default 2 years: the common EU limit for audience-measurement
// cookies, within the 14 months GA4 keeps event data. The privacy policy states this period.
export const GA_COOKIE_EXPIRES_SECONDS = 395 * 24 * 60 * 60;

/**
 * Google Analytics in Consent Mode's basic implementation: gtag.js is loaded only after the
 * visitor accepts analytics cookies, so without that consent nothing reaches Google Analytics, not
 * even the cookieless pings of the advanced implementation. The Consent Mode defaults (everything
 * denied) stay, as Google tags expect them before any update.
 *
 * `updateAnalyticsConsent` calls `loadGoogleAnalytics` when consent is given on an open page, and
 * `disableGoogleAnalytics` when it is withdrawn: gtag.js can't be unloaded, so its documented
 * `ga-disable-<ID>` switch stops it from sending anything more.
 */
export function getGoogleAnalyticsScript(gaId: string): string {
  return `
!function(w,d,id){
  w.dataLayer=w.dataLayer||[];
  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  w.gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied'
  });

  var loaded=false;
  w.loadGoogleAnalytics=function(){
    w['ga-disable-'+id]=false;
    w.gtag('consent','update',{analytics_storage:'granted'});
    if(loaded)return;
    loaded=true;
    var s=d.createElement('script');
    s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
    d.head.appendChild(s);
    w.gtag('js',new Date());
    w.gtag('config',id,{cookie_expires:${GA_COOKIE_EXPIRES_SECONDS}});
  };
  w.disableGoogleAnalytics=function(){
    w['ga-disable-'+id]=true;
    w.gtag('consent','update',{analytics_storage:'denied'});
  };
  if(d.cookie.indexOf('${COOKIE_CONSENT_KEY}=granted')!==-1)w.loadGoogleAnalytics();
}(window,document,${JSON.stringify(gaId)});
`;
}
