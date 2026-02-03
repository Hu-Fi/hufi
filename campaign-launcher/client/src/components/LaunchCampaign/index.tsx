import { type FC, type PropsWithChildren, useState } from 'react';

import { Box, Button, Tooltip, Typography, type SxProps } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import StakingRequirementModal from '@/components/modals/StakingRequirementModal';
import { ROUTES } from '@/constants';
import { useIsXlDesktop } from '@/hooks/useBreakpoints';
import useRetrieveSigner from '@/hooks/useRetrieveSigner';
import { useStakeContext } from '@/providers/StakeProvider';

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

type Props = {
  variant: 'outlined' | 'contained';
  sx?: SxProps;
  withTooltip?: boolean;
  handleCallbackOnClick?: () => void;
};

const LaunchCampaign: FC<Props> = ({
  variant,
  sx,
  withTooltip = false,
  handleCallbackOnClick,
}) => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const navigate = useNavigate();
  const { signer } = useRetrieveSigner();
  const isXl = useIsXlDesktop();
  const { fetchStakingData, isClientInitializing } = useStakeContext();

  const isDisabled = !signer || isClientInitializing;

  const handleLaunchCampaignClick = async () => {
    if (isDisabled) return null;

    const _stakedAmount = Number(await fetchStakingData());
    if (_stakedAmount === 0) {
      setIsSetupModalOpen(true);
    } else {
      navigate(ROUTES.CREATE_CAMPAIGN);
    }

    handleCallbackOnClick?.();
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
        <StakingRequirementModal
          open={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
        />
      )}
    </>
  );
};

export default LaunchCampaign;
