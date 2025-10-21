import { type FC, type PropsWithChildren, useState } from 'react';

import { Box, Button, Tooltip, Typography, type SxProps } from '@mui/material';

import CampaignSetupModal from '@/components/modals/CampaignSetupModal';
import CreateCampaignModal from '@/components/modals/CreateCampaignModal';
import { useIsXlDesktop } from '@/hooks/useBreakpoints';
import useRetrieveSigner from '@/hooks/useRetrieveSigner';
import { useStakeContext } from '@/providers/StakeProvider';
import type { CampaignType } from '@/types';

type Props = {
  variant: 'outlined' | 'contained';
  sx?: SxProps;
  withTooltip?: boolean;
};

type ButtonWrapperProps = {
  isDisabled: boolean;
  withTooltip: boolean;
};

const ButtonWrapper: FC<PropsWithChildren<ButtonWrapperProps>> = ({
  isDisabled,
  withTooltip,
  children,
}) => {
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
            },
          },
        }}
        arrow
        placement="left"
      >
        <Box sx={{ cursor: 'pointer' }}>{children}</Box>
      </Tooltip>
    );
  }

  return children;
};

const LaunchCampaign: FC<Props> = ({ variant, sx, withTooltip = false }) => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);

  const { signer } = useRetrieveSigner();
  const isXl = useIsXlDesktop();
  const { isClientInitializing } = useStakeContext();

  const isDisabled = !signer || isClientInitializing;

  const handleLaunchCampaignClick = async () => {
    if (isDisabled) return null;

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
