import { type FC, type PropsWithChildren, useCallback } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  showCloseButton?: boolean;
  showBackButton?: boolean;
  isLoading?: boolean;
  sx?: SxProps<Theme>;
  handleBackClick?: () => void;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
  elevation = 0,
  showCloseButton = true,
  showBackButton = false,
  isLoading = false,
  children,
  sx,
  handleBackClick,
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
          disabled={isLoading}
          onClick={handleBackClick}
          sx={{
            display: showBackButton ? 'flex' : 'none',
            bgcolor: 'rgba(205, 199, 255, 0.12)',
            p: 0.5,
            color: 'text.primary',
            position: 'absolute',
            top: { xs: '16px', md: '40px' },
            left: { xs: '16px', md: '32px' },
            '&:hover': {
              bgcolor: 'unset',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <IconButton
          disabled={isLoading}
          onClick={handleClose}
          sx={{
            display: showCloseButton ? 'flex' : 'none',
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
