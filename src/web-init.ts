// ============================================
// Web-specific entry point for Expo
// Injects global CSS and initializes the web app
// ============================================
import { Platform } from 'react-native';

// Native builds open Stripe Checkout / Billing Portal in an in-app browser.
// Stripe can only return to https URLs, so it lands here with
// `app_return=1`; hand the result back to the app via its URL scheme, which
// also closes the in-app browser session (see paymentService.openStripeUrl).
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('app_return') === '1') {
    params.delete('app_return');
    window.location.replace(`lottodream://billing?${params.toString()}`);
  }
}

// Inject Rubik font global styles for web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap');

    * {
      font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    html, body {
      font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body > div,
    div > span,
    div > p,
    button,
    input,
    textarea {
      font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  `;
  document.head.appendChild(style);
}
