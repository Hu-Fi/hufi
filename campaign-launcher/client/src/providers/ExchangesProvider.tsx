import { FC, PropsWithChildren, createContext, useContext } from 'react';

import { useExchanges } from '../hooks/useExchanges';

type Exchange = {
  displayName: string;
  logo: string;
  name: string;
  type: string;
  url: string;
};

type ExchangesContextType = {
  exchanges: Exchange[] | undefined;
  isPending: boolean;
  error: Error | null;
};

const ExchangesContext = createContext<ExchangesContextType | undefined>(
  undefined
);

export const useExchangesContext = () => {
  const context = useContext(ExchangesContext);
  if (!context) {
    throw new Error(
      'useExchangesContext must be used within an ExchangesProvider'
    );
  }
  return context;
};

const ExchangesProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: exchanges, isPending, error } = useExchanges();

  return (
    <ExchangesContext.Provider value={{ exchanges, isPending, error }}>
      {children}
    </ExchangesContext.Provider>
  );
};

export default ExchangesProvider;
