// ============================================
// Web-specific entry point for Expo
// Injects global CSS and initializes the web app
// ============================================
import { Platform } from 'react-native';

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
