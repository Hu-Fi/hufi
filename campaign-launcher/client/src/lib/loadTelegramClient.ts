let telegramSdkPromise: Promise<void> | null = null;

export function loadTelegramClient(): Promise<void> {
  if (window.Telegram?.Login) return Promise.resolve();
  if (telegramSdkPromise) return telegramSdkPromise;

  telegramSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://oauth.telegram.org/js/telegram-login.js"]'
    );

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Telegram SDK failed')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://oauth.telegram.org/js/telegram-login.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Telegram SDK failed'));
    document.head.appendChild(script);
  });

  return telegramSdkPromise;
}
