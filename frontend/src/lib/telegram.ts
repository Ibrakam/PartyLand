export function isTelegramWebApp(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).Telegram?.WebApp;
  }
  
  export function getTelegramWebApp() {
    if (typeof window === 'undefined') return null;
    return (window as any).Telegram?.WebApp || null;
  }
  
  export function initTelegramWebApp() {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
      return webApp;
    }
    return null;
  }
  