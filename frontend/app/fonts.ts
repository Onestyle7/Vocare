import localFont from 'next/font/local';

export const korbin = localFont({
  variable: '--korbin', // nazwa zmiennej CSS (nie mylić z utilsem font-korbin)
  display: 'swap',
  preload: true,
  src: [
    { path: '../public/fonts/korbin/fonnts.com-Korbin_Light.otf', weight: '300', style: 'normal' },
    {
      path: '../public/fonts/korbin/fonnts.com-Korbin_Light_Italic.otf',
      weight: '300',
      style: 'italic',
    },
    { path: '../public/fonts/korbin/fonnts.com-Korbin_Book.otf', weight: '400', style: 'normal' }, // Book ~ 400
    {
      path: '../public/fonts/korbin/fonnts.com-Korbin_Book_Italic.otf',
      weight: '400',
      style: 'italic',
    },
    { path: '../public/fonts/korbin/fonnts.com-Korbin_Medium.otf', weight: '500', style: 'normal' },
    {
      path: '../public/fonts/korbin/fonnts.com-Korbin_Medium_Italic.otf',
      weight: '500',
      style: 'italic',
    },
    { path: '../public/fonts/korbin/fonnts.com-Korbin_Bold.otf', weight: '700', style: 'normal' },
    {
      path: '../public/fonts/korbin/fonnts.com-Korbin_Bold_Italic.otf',
      weight: '700',
      style: 'italic',
    },
    { path: '../public/fonts/korbin/fonnts.com-Korbin_Black.otf', weight: '900', style: 'normal' },
    {
      path: '../public/fonts/korbin/fonnts.com-Korbin_Black_Italic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
});
