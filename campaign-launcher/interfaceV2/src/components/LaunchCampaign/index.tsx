import { FC, useState } from 'react';

import { Button, SxProps } from '@mui/material';
import { useAccount } from 'wagmi';

import useLeader from '../../hooks/useLeader';
import CreateCampaignMenuModal from '../modals/CreateCampaignMenuModal';
import CreateCampaignModal from '../modals/CreateCampaignModal';
interface Props {
  variant: 'outlined' | 'contained';
  sx?: SxProps;
}

const LaunchCampaign: FC<Props> = ({ variant, sx }) => {
  const [openCreateCampaignModal, setOpenCreateCampaignModal] = useState(false);
  const [
    openCreateCampaignMenuModal,
    setOpenCreateCampaignMenuModal,
  ] = useState(false);
  const { isConnected } = useAccount();
  const { data: leader, refetch } = useLeader({ enabled: false });

  const handleCloseCreateCampaignMenuModal = () => {
    setOpenCreateCampaignMenuModal(false);
  };

  const handleOpenCreateCampaignModal = () => {
    setOpenCreateCampaignModal(true);
  };

  const onClick = async () => {
    await refetch();
    if (+(leader?.amountStaked ?? '0') > 0) {
      setOpenCreateCampaignModal(true);
    } else {
      setOpenCreateCampaignMenuModal(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size="large"
        sx={{
          color: variant === 'outlined' ? 'primary.main' : 'primary.contrast',
          height: '42px',
          fontWeight: 600,
          ...sx,
        }}
        disabled={!isConnected}
        onClick={onClick}
      >
        Launch Campaign
      </Button>
      <CreateCampaignMenuModal
        open={openCreateCampaignMenuModal}
        onClose={handleCloseCreateCampaignMenuModal}
        handleOpenCreateCampaignModal={handleOpenCreateCampaignModal}
      />
      <CreateCampaignModal
        open={openCreateCampaignModal}
        onClose={() => setOpenCreateCampaignModal(false)}
      />
    </>
  );
};

export default LaunchCampaign;
