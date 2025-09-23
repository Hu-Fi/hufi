import { FC, PropsWithChildren, useState } from 'react';

import { Box, Button, SxProps, Tooltip, Typography } from '@mui/material';

import { useIsXlDesktop } from '../../hooks/useBreakpoints';
import useRetrieveSigner from '../../hooks/useRetrieveSigner';
import { useStakeContext } from '../../providers/StakeProvider';
import CreateCampaignModal from '../modals/CreateCampaignModal';
import StakeHmtPromptModal from '../modals/StakeHmtPromptModal';

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
  const [openCreateCampaignModal, setOpenCreateCampaignModal] = useState(false);
  const [openStakeHmtPromptModal, setOpenStakeHmtPromptModal] = useState(false);

  const { signer } = useRetrieveSigner();
  const isXl = useIsXlDesktop();
  const { stakedAmount, isFetchingInfo, isClientInitializing } =
    useStakeContext();

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
