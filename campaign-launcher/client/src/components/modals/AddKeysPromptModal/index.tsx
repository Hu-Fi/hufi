import type { FC } from 'react';

import { Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import BaseModal from '../BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

const AddKeysPromptModal: FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate(ROUTES.MANAGE_API_KEYS);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        textAlign: 'center',
        color: 'text.primary',
        px: { xs: 3, md: 4 },
      }}
    >
      <Typography variant="h4" py={1} mb={2}>
        Join Campaign
      </Typography>
      <Typography
        variant="body2"
        mb={2}
        px={{ xs: 2, md: 10 }}
        textAlign="center"
      >
        To join the campaign, please make sure to add your API keys under the
        Manage Keys page. This step is required to participate.
      </Typography>
      <Button variant="contained" size="large" onClick={handleButtonClick}>
        Add API Keys
      </Button>
    </BaseModal>
  );
};

export default AddKeysPromptModal;
