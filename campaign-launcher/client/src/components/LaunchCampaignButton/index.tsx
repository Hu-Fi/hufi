import { type FC } from 'react';

import { Button, type SxProps } from '@mui/material';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/constants';

type Props = {
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps;
  handleCallbackOnClick?: () => void;
};

const LaunchCampaignButton: FC<Props> = ({
  size,
  sx,
  handleCallbackOnClick,
}) => {
  const navigate = useNavigate();

  const handleLaunchCampaignClick = async () => {
    navigate(ROUTES.LAUNCH_CAMPAIGN);
    handleCallbackOnClick?.();
  };

  return (
    <Button
      variant="contained"
      size={size}
      color="error"
      sx={{
        color: 'white',
        width: 'fit-content',
        ...sx,
      }}
      onClick={handleLaunchCampaignClick}
    >
      Launch Campaign
    </Button>
  );
};

export default LaunchCampaignButton;
