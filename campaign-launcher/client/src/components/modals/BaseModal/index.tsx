import { type FC, type PropsWithChildren, useCallback } from 'react';

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
  isLoading?: boolean;
  sx?: SxProps<Theme>;
  closeButtonSx?: SxProps<Theme>;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
  isLoading = false,
  sx,
  closeButtonSx,
  children,
}) => {
  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 0,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(7px)',
            background: 'rgba(0, 0, 0, 0.3)',
          },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          py: 6,
          px: 4,
          width: 640,
          maxHeight: '700px',
          overflowY: 'hidden',
          bgcolor: '#251d47',
          borderRadius: '20px',
          position: 'relative',
          boxShadow: 'none',
          ...sx,
        }}
      >
        <IconButton
          disabled={isLoading}
          onClick={handleClose}
          sx={{
            p: 0,
            color: 'white',
            position: 'absolute',
            top: 48,
            right: 32,
            '&:hover': {
              bgcolor: 'unset',
            },
            ...closeButtonSx,
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
