/* eslint-disable @typescript-eslint/no-explicit-any */
// Declaration for Google gtag function
interface Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
}
