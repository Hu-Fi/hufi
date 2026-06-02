export {};

declare global {
  interface Window {
    Telegram?: {
      Login: {
        init: (
          options: InitOptions,
          callback?: (result: TelegramLoginResult) => void
        ) => void;
        open: (callback?: (result: TelegramLoginResult) => void) => void;
        auth: (
          options: InitOptions,
          callback?: (result: TelegramLoginResult) => void
        ) => void;
      };
    };
  }

  type InitOptions = {
    client_id: string;
    request_access?: string | string[];
    nonce?: string;
    lang?: string;
  };

  type TelegramLoginResult =
    | { id_token: string; user: Record<string, unknown> }
    | { error: string };
}
