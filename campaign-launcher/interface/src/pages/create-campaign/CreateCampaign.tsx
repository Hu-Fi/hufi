import { FC } from 'react';

// import { Navigate } from 'react-router-dom';

import { CampaignForm, CampaignFormValues } from './CampaignForm';
import { useUploadManifest } from '../../api/manifest';
import { useCreateEscrow, useLeader } from '../../hooks';
import { Loading } from '../../components/loading';
// import { PATHS } from '../../routes';

export const CreateCampaign: FC = () => {
  const { mutateAsync: uploadManifest } = useUploadManifest();
  const createEscrow = useCreateEscrow();
  const { loading, leader } = useLeader();
  // const { setNotification } = useNotification();

  const handleSubmit = async (data: CampaignFormValues) => {
    const { data: manifest } = await uploadManifest({
      ...data,
      startDate: data.startDate.toISOString(),
    });

    await createEscrow(manifest, data.fundAmount);
  };

  // if (
  //   !loading &&
  //   (leader === null || leader?.amountStaked.toString() === '0')
  // ) {
  //   setNotification({
  //     type: 'warning',
  //     message: 'You must stake HMT to create a campaign',
  //   });

  //   return <Navigate to={PATHS.STAKE_HMT} />;
  // }

  return (
    <>{loading ? <Loading /> : <CampaignForm onSubmit={handleSubmit} />}</>
  );
};
