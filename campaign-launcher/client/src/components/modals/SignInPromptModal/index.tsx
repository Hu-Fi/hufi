import { type FC } from 'react';

import { Button, List, ListItem, Stack, Typography } from '@mui/material';

import BaseModal from '@/components/modals/BaseModal';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

type Props = {
  open: boolean;
  onClose: () => void;
};

const SignInPromptModal: FC<Props> = ({ open, onClose }) => {
  const { signIn, isLoading } = useWeb3Auth();

  const handleSignIn = async () => {
    try {
      await signIn();
      onClose();
    } catch (error) {
      console.error('Failed to sign in', error);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        color: 'text.primary',
        px: { xs: 3, md: 4 },
      }}
    >
      <Stack>
        <Typography variant="h5" mb={2}>
          Sign in for additional features:
        </Typography>
        <List sx={{ p: 0, listStyle: 'disc', pl: 1.5 }}>
          <ListItem sx={{ p: 0, display: 'list-item', lineHeight: '12px' }}>
            <Typography variant="body1">Manage API keys</Typography>
          </ListItem>
          <ListItem sx={{ p: 0, display: 'list-item', lineHeight: '12px' }}>
            <Typography variant="body1">Join campaigns</Typography>
          </ListItem>
        </List>
        <Stack mt={3} gap={1}>
          <Button
            variant="contained"
            size="large"
            disabled={isLoading}
            onClick={handleSignIn}
          >
            Sign in
          </Button>
          <Button
            variant="outlined"
            size="large"
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </BaseModal>
  );
};

export default SignInPromptModal;
