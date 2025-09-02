import 'kkiapay-react';

declare module 'kkiapay-react' {
  interface IData {
    return_url?: string;
    // Remarque: La documentation mentionne callback_url, mais le type utilise callback
  }
}
