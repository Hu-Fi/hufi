import { FC } from 'react';

import { useStakeHMT } from '../../hooks';
import { StakeHMTForm, StakeHMTFormValues } from './StakeHMTForm';

export const StakeHMT: FC = () => {
  const stakeHMT = useStakeHMT();

  const handleSubmit = async (data: StakeHMTFormValues) => {
    await stakeHMT(data.amount);
  };

  return <StakeHMTForm onSubmit={handleSubmit} />;
};
