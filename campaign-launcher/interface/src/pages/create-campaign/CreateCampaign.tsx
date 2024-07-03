import { FC } from 'react';

import { ethers } from 'ethers';
import { Navigate } from 'react-router-dom';

import { CampaignForm, CampaignFormValues } from './CampaignForm';
import { useUploadManifest } from '../../api/manifest';
import { Loading } from '../../components/loading';
import { useCreateEscrow, useLeader, useNotification } from '../../hooks';
import { PATHS } from '../../routes';

export const CreateCampaign: FC = () => {
  const { mutateAsync: uploadManifest } = useUploadManifest();
  const { isLoading: isCreatingEscrow, createEscrow } = useCreateEscrow();
  const { loading, leader } = useLeader();
  const { setNotification } = useNotification();

  const handleSubmit = async (data: CampaignFormValues) => {
    const fundAmount = ethers.parseUnits(data.fundAmount.toString(), 'ether');

    const { data: manifest } = await uploadManifest({
      ...data,
      fundAmount: fundAmount.toString(),
      startDate: data.startDate.toISOString(),
    });

    await createEscrow(manifest, fundAmount);
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
