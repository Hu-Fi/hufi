import { type FC, type PropsWithChildren } from 'react';

import { type SxProps, type Theme } from '@mui/material';

import BaseDrawer from '@/components/BaseDrawer';
import BaseModal from '@/components/modals/BaseModal';
import { useIsMobile } from '@/hooks/useBreakpoints';

type Props = {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  desktopSx?: SxProps<Theme>;
  mobileSx?: SxProps<Theme>;
  closeButtonSx?: SxProps<Theme>;
};

const ResponsiveOverlay: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
  isLoading = false,
  desktopSx,
  mobileSx,
  closeButtonSx,
  children,
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <BaseModal
        open={open}
        onClose={onClose}
        isLoading={isLoading}
        sx={desktopSx}
        closeButtonSx={closeButtonSx}
      >
        {children}
      </BaseModal>
    );
  }

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      sx={mobileSx}
      closeButtonSx={closeButtonSx}
    >
      {children}
    </BaseDrawer>
  );
};

export default ResponsiveOverlay;
