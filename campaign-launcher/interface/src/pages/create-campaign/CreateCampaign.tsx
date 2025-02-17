import { FC, useEffect, useMemo } from 'react';

import { CampaignForm, CampaignFormValues } from './CampaignForm';
import { useLeader } from '../../api/leader';
import { Loading } from '../../components/loading';
import { useCreateEscrow, useNotification } from '../../hooks';

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

  const isValidLeader = useMemo(
    () => !loading && +(leader?.amountStaked ?? '0') > 0,
    [loading, leader]
  );

  useEffect(() => {
    if (!isValidLeader) {
      setNotification({
        type: 'warning',
        message: 'You must stake HMT to create a campaign',
      });
    }
  }, [loading]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <CampaignForm
          isSubmitting={isCreatingEscrow}
          onSubmit={handleSubmit}
          disabled={!isValidLeader}
        />
      )}
    </>
  );
};
