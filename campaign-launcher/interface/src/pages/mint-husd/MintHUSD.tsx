import { FC } from 'react';

import { MintHUSDForm, MintHUSDFormValues } from './MintHUSDForm';
import { useMintHUSD } from '../../hooks';

export const MintHUSD: FC = () => {
  const mintHUSD = useMintHUSD();

  const handleSubmit = async (data: MintHUSDFormValues) => {
    await mintHUSD(data.amount);
  };

  return <MintHUSDForm onSubmit={handleSubmit} />;
};
