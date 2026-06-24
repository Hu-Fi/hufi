import type { FC } from 'react';

import { Box, IconButton } from '@mui/material';

import { GridViewIcon, TableViewIcon } from '@/icons';

type Props = {
  isGridView: boolean;
  disableFilters: boolean;
  onViewChange: (view: 'grid' | 'table') => void;
};

const CampaignsViewToggle: FC<Props> = ({
  isGridView,
  disableFilters,
  onViewChange,
}) => {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        borderRadius: '54px',
        border: '1px solid',
        borderColor: 'background.paper',
        width: 'fit-content',
        overflow: 'hidden',
      }}
    >
      <IconButton
        disableRipple
        disabled={disableFilters}
        sx={{
          py: 1,
          px: 1.5,
          bgcolor: isGridView ? 'background.paper' : 'transparent',
          borderRadius: 0,
        }}
        onClick={() => onViewChange('grid')}
      >
        <GridViewIcon
          sx={{
            fill: 'transparent',
            '& path': {
              stroke: (theme) =>
                isGridView
                  ? theme.palette.accent.main
                  : theme.palette.neutral['100'],
            },
          }}
        />
      </IconButton>
      <IconButton
        disableRipple
        disabled={disableFilters}
        sx={{
          py: 1,
          px: 1.5,
          bgcolor: isGridView ? 'transparent' : 'background.paper',
          borderRadius: 0,
        }}
        onClick={() => onViewChange('table')}
      >
        <TableViewIcon
          sx={{
            fill: 'transparent',
            '& path': {
              stroke: (theme) =>
                isGridView
                  ? theme.palette.neutral['100']
                  : theme.palette.accent.main,
            },
          }}
        />
      </IconButton>
    </Box>
  );
};

export default CampaignsViewToggle;
