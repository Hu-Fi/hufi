import { FC, PropsWithChildren, useState } from 'react';

import { Box, Button, SxProps, Tooltip, Typography } from '@mui/material';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import useRetrieveSigner from '../../hooks/useRetrieveSigner';
import { useStakeContext } from '../../providers/StakeProvider';
import { CampaignType } from '../../types';
import CampaignSetupModal from '../modals/CampaignSetupModal';
import CreateCampaignModal from '../modals/CreateCampaignModal';

type Props = {
  variant: 'outlined' | 'contained';
  sx?: SxProps;
  withTooltip?: boolean;
};

type ButtonWrapperProps = {
  isDisabled: boolean;
  withTooltip: boolean;
};

const ButtonWrapper: FC<PropsWithChildren<ButtonWrapperProps>> = ({ isDisabled, withTooltip, children }) => {
  if (isDisabled && withTooltip) {
    return (
      <Tooltip 
        title={
          <Typography variant="tooltip">
            You&apos;ll need to connect your wallet before launching a campaign
          </Typography>
        }
        slotProps={{
          tooltip: {
            sx: {
              width: '150px',
              lineHeight: '14px',
            }
          }
        }}
        arrow 
        placement="left"
      >
        <Box sx={{ cursor: 'pointer' }}>
          {children}
        </Box>
      </Tooltip>
    )
  }

  return children
}

const LaunchCampaign: FC<Props> = ({ variant, sx, withTooltip = false }) => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null)
  const [stakedAmount, setStakedAmount] = useState<number>(0);

  const { signer } = useRetrieveSigner();
  const isXl = useIsXlDesktop();
  const { isClientInitializing, fetchStakingData } = useStakeContext();

  const isDisabled = !signer || isClientInitializing;

  const handleLaunchCampaignClick = async () => {
    if (isDisabled) return null;

    const _stakedAmount = await fetchStakingData();
    setStakedAmount(+(_stakedAmount ?? '0'));
    setIsSetupModalOpen(true);
  };

  const handleChangeCampaignType = (type: CampaignType) => {
    setCampaignType(type);
  };

  const handleOpenFormModal = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCampaignType(null);
  };

  return (
    <>
      <ButtonWrapper isDisabled={isDisabled} withTooltip={withTooltip}>
        <Button
          variant={variant}
          size={isXl ? 'large' : 'medium'}
          sx={{
            color: variant === 'outlined' ? 'primary.main' : 'primary.contrast',
            height: '42px',
            ...sx,
          }}
          disabled={isDisabled}
          onClick={handleLaunchCampaignClick}
        >
          Launch Campaign
        </Button>
      </ButtonWrapper>
      {isSetupModalOpen && (
        <CampaignSetupModal
          open={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          stakedAmount={stakedAmount}
          campaignType={campaignType}
          handleChangeCampaignType={handleChangeCampaignType}
          handleOpenFormModal={handleOpenFormModal}
        />
      )}
      {campaignType && isFormModalOpen && (
        <CreateCampaignModal
          open={isFormModalOpen}
          onClose={handleCloseFormModal}
          campaignType={campaignType}
          
        />
      )}
    </>
  );
};

export default LaunchCampaign;
