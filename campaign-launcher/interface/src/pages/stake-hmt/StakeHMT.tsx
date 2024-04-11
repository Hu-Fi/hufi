import { FC } from 'react';

import { StakeHMTForm, StakeHMTFormValues } from './StakeHMTForm';
import { useStakeHMT } from '../../hooks';

export const StakeHMT: FC = () => {
  const stakeHMT = useStakeHMT();

  const handleSubmit = async (data: StakeHMTFormValues) => {
    await stakeHMT(data.amount);
  };

  return <StakeHMTForm onSubmit={handleSubmit} />;
};
