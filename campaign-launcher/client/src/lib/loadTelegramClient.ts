let telegramSdkPromise: Promise<void> | null = null;

const SCRIPT_SRC = 'https://oauth.telegram.org/js/telegram-login.js';

export function loadTelegramLoginClient(): Promise<void> {
  if (window.Telegram?.Login) return Promise.resolve();
  if (telegramSdkPromise) return telegramSdkPromise;

  telegramSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Telegram SDK failed'));
    document.head.appendChild(script);
  });

  return telegramSdkPromise;
}
