import { Api } from "./client";

export const api = new Api({
	baseUrl: import.meta.env.VITE_APP_CAMPAIGN_LAUNCHER_API_URL,
});