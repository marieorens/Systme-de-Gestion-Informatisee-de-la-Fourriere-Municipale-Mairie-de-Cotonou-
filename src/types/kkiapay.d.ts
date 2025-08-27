// Étend les types pour kkiapay-react
import 'kkiapay-react';

declare module 'kkiapay-react' {
  // Étend l'interface IData pour inclure return_url
  interface IData {
    return_url?: string;
    // Remarque: La documentation mentionne callback_url, mais le type utilise callback
  }
}
