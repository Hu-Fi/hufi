import type { FC, PropsWithChildren } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
  IconButton,
  Modal,
  Paper,
  type SxProps,
  type Theme,
} from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  elevation?: number;
  sx?: SxProps<Theme>;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
  elevation = 0,
  children,
  sx,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: { xs: 4, md: 0 },
      }}
      slotProps={{
        backdrop: {
          sx: {
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.13) 0%, rgba(255, 255, 255, 0.13) 100%), rgba(16, 7, 53, 0.80)',
          },
        },
      }}
    >
      <Paper
        elevation={elevation}
        sx={{
          py: 5,
          px: 4,
          width: 870,
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: 'background.default',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          position: 'relative',
          boxShadow: 'none',
          ...sx,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            p: 0,
            color: 'text.primary',
            position: 'absolute',
            top: { xs: '16px', md: '40px' },
            right: { xs: '16px', md: '32px' },
            '&:hover': {
              bgcolor: 'unset',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Paper>
    </Modal>
  );
};

export default BaseModal;
