import type { FC, PropsWithChildren } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
  Modal,
  Box,
  IconButton,
  type SxProps,
  type Theme,
} from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  sx?: SxProps<Theme>;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
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
      }}
      slotProps={{
        backdrop: {
          sx: {
            opacity: 0.8,
          },
        },
      }}
    >
      <Box
        sx={{
          py: 4,
          px: 4,
          width: 870,
          maxHeight: '80vh',
          overflowY: 'auto',
          bgcolor: 'background.default',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          position: 'relative',
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
      </Box>
    </Modal>
  );
};

export default BaseModal;
