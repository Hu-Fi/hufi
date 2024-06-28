import { FC } from 'react';

import { MintHUSDForm, MintHUSDFormValues } from './MintHUSDForm';
import { useMintHUSD } from '../../hooks';

export const MintHUSD: FC = () => {
  const { isLoading: isMintingHUSD, mintHUSD } = useMintHUSD();

  const handleSubmit = async (data: MintHUSDFormValues) => {
    await mintHUSD(data.amount);
  };

  return <MintHUSDForm isSubmitting={isMintingHUSD} onSubmit={handleSubmit} />;
};
