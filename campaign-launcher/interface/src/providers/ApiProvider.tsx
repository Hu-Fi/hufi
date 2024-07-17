import { FC, PropsWithChildren, createContext } from 'react';

import { Api } from '../api/client/Api';

const api = new Api({
  baseUrl: import.meta.env.VITE_APP_CAMPAIGN_LAUNCHER_API_URL,
});

export const ApiContext = createContext<Api<unknown> | undefined>(undefined);

export const ApiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};
