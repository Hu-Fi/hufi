import { FC } from 'react';

import { CampaignForm, CampaignFormValues } from './CampaignForm';
import { useUploadManifest } from '../../api/manifest';
import { useCreateEscrow } from '../../hooks';


export const CreateCampaign: FC = () => {
  const { mutateAsync: uploadManifest } = useUploadManifest();
  const createEscrow = useCreateEscrow();

  const handleSubmit = async (data: CampaignFormValues) => {
    const { data: manifest } = await uploadManifest({
      ...data,
      startDate: data.startDate.toISOString(),
    });

    await createEscrow(manifest, data.fundAmount);
  };

  return (
    <>
      <CampaignForm onSubmit={handleSubmit} />
    </>
  );
};
