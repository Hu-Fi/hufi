import { FC } from 'react';

import { Navigate } from 'react-router-dom';

import { CampaignForm, CampaignFormValues } from './CampaignForm';
import { useLeader } from '../../api/leader';
import { Loading } from '../../components/loading';
import { useCreateEscrow, useNotification } from '../../hooks';
import { PATHS } from '../../routes';

export const CreateCampaign: FC = () => {
  const { isLoading: isCreatingEscrow, createEscrow } = useCreateEscrow();
  const { isLoading: loading, data: leader } = useLeader();
  const { setNotification } = useNotification();

  const handleSubmit = async ({ fundToken, ...data }: CampaignFormValues) => {
    await createEscrow(fundToken, {
      ...data,
      fundAmount: data.fundAmount.toString(),
      startDate: data.startDate.toISOString(),
    });
  };

  if (
    !loading &&
    (leader === null || leader?.amountStaked.toString() === '0')
  ) {
    setNotification({
      type: 'warning',
      message: 'You must stake HMT to create a campaign',
    });

    return <Navigate to={PATHS.STAKE_HMT} />;
  }

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <CampaignForm isSubmitting={isCreatingEscrow} onSubmit={handleSubmit} />
      )}
    </>
  );
};
