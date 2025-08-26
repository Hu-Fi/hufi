import { FC, useState } from 'react';

import { Button, SxProps } from '@mui/material';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import useRetrieveSigner from '../../hooks/useRetrieveSigner';
import { useStakeContext } from '../../providers/StakeProvider';
import CreateCampaignModal from '../modals/CreateCampaignModal';
import StakeHmtPromptModal from '../modals/StakeHmtPromptModal';

type Props = {
  variant: 'outlined' | 'contained';
  sx?: SxProps;
}

const LaunchCampaign: FC<Props> = ({ variant, sx }) => {
  const [openCreateCampaignModal, setOpenCreateCampaignModal] = useState(false);
  const [openStakeHmtPromptModal, setOpenStakeHmtPromptModal] = useState(false);

  const { signer } = useRetrieveSigner();
  const isXl = useIsXlDesktop();
  const { stakedAmount, isFetchingInfo, isClientInitializing } = useStakeContext();
  
  const isDisabled = !signer || isClientInitializing || isFetchingInfo;

  const handleOpenCreateCampaignModal = () => {
    setOpenCreateCampaignModal(true);
  };

  const onClick = async () => {
    if (isDisabled) return null;
    
    if (+(stakedAmount ?? '0') > 0) {
      setOpenCreateCampaignModal(true);
    } else {
      setOpenStakeHmtPromptModal(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={isXl ? 'large' : 'medium'}
        sx={{
          color: variant === 'outlined' ? 'primary.main' : 'primary.contrast',
          height: '42px',
          ...sx,
        }}
        disabled={isDisabled}
        onClick={onClick}
      >
        Launch Campaign
      </Button>
      <StakeHmtPromptModal
        open={openStakeHmtPromptModal}
        onClose={() => setOpenStakeHmtPromptModal(false)}
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
