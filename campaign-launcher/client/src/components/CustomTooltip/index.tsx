import { useState } from 'react';

import {
  Box,
  ClickAwayListener,
  Tooltip,
  type TooltipProps,
} from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';

const CustomTooltip = ({ children, ...props }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleTooltipClose = () => {
    setOpen(false);
  };

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
              sx: {
                '.MuiTooltip-tooltipPlacementTop': {
                  mb: '8px !important',
                },
                '.MuiTooltip-tooltipPlacementBottom': {
                  mt: '8px !important',
                },
                '.MuiTooltip-tooltipPlacementLeft': {
                  mr: '8px !important',
                },
                '.MuiTooltip-tooltipPlacementRight': {
                  ml: '8px !important',
                },
              },
            },
          }}
          {...props}
        >
          <Box
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
          >
            {children}
          </Box>
        </Tooltip>
      </ClickAwayListener>
    );
  }

  return <Tooltip {...props}>{children}</Tooltip>;
};

export default CustomTooltip;
