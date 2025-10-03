import { FC, PropsWithChildren, useState } from 'react';

import { Box, Button, SxProps, Tooltip, Typography } from '@mui/material';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import useRetrieveSigner from '../../hooks/useRetrieveSigner';
import { useStakeContext } from '../../providers/StakeProvider';
import CampaignSetupModal from '../modals/CampaignSetupModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { signer } = useRetrieveSigner();
  const isXl = useIsXlDesktop();
  const { isClientInitializing } = useStakeContext();

  const isDisabled = !signer || isClientInitializing;

  const onClick = async () => {
    if (isDisabled) return null;

    setIsModalOpen(true);
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
          onClick={onClick}
        >
          Launch Campaign
        </Button>
      </ButtonWrapper>
      <CampaignSetupModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default LaunchCampaign;
