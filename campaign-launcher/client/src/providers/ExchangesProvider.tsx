import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';

import { useExchanges } from '../hooks/useExchanges';
import { Exchange } from '../types';

type ExchangesContextType = {
  exchanges: Exchange[] | undefined;
  exchangesMap: Map<string, Omit<Exchange, 'name'>>;
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

  const exchangesMap = useMemo(() => {
    const map = new Map<string, Omit<Exchange, 'name'>>();
    if (exchanges) {
      exchanges.forEach(({ name, ...exchange }) => {
        map.set(name, exchange);
      });
    }
    return map;
  }, [exchanges]);

  return (
    <ExchangesContext.Provider
      value={{ exchanges, exchangesMap, isPending, error }}
    >
      {children}
    </ExchangesContext.Provider>
  );
};

export default ExchangesProvider;
