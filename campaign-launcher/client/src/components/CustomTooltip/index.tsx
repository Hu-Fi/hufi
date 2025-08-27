import { useState } from 'react';

import { Box, ClickAwayListener, Tooltip, TooltipProps } from '@mui/material';

import { useIsMobile } from '../../hooks/useBreakpoints';

const CustomTooltip = ({ children, ...props }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleTooltipClose = () => {
    setOpen(false);
  }

  if (isMobile) {
    return (
      <ClickAwayListener onClickAway={handleTooltipClose}>
        <Tooltip 
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          onClose={handleTooltipClose}
          slotProps={{
            popper: {
              disablePortal: true,
            },
          }}
          {...props}
        >
          <Box onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}>
            {children}
          </Box>
        </Tooltip>
      </ClickAwayListener>
    );
  }

  return <Tooltip {...props}>{children}</Tooltip>;
};

export default CustomTooltip;