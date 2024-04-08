import { FC, PropsWithChildren, createContext } from 'react';

import { Api } from '@/api/client/Api';

const api = new Api();

export const ApiContext = createContext<Api | undefined>(undefined);

export const ApiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};
