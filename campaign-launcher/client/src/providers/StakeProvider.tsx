import {
  type FC,
  type PropsWithChildren,
  createContext,
  useContext,
} from 'react';

import { useStake } from '@/hooks/useStake';

const StakeContext = createContext<ReturnType<typeof useStake> | undefined>(
  undefined
);

const StakeProvider: FC<PropsWithChildren> = ({ children }) => {
  const stake = useStake();

  return (
    <StakeContext.Provider value={stake}>{children}</StakeContext.Provider>
  );
};

export const useStakeContext = () => {
  const context = useContext(StakeContext);
  if (!context) {
    throw new Error('useStakeContext must be used within a StakeProvider');
  }
  return context;
};

export default StakeProvider;
