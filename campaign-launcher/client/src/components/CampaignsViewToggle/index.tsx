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
        border: '1px solid #251d47',
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
          bgcolor: isGridView ? '#251d47' : 'transparent',
          borderRadius: 0,
        }}
        onClick={() => onViewChange('grid')}
      >
        <GridViewIcon
          sx={{
            fill: 'transparent',
            '& path': {
              stroke: isGridView ? '#fa2a75' : 'white',
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
          bgcolor: isGridView ? 'transparent' : '#251d47',
          borderRadius: 0,
        }}
        onClick={() => onViewChange('table')}
      >
        <TableViewIcon
          sx={{
            fill: 'transparent',
            '& path': {
              stroke: isGridView ? 'white' : '#fa2a75',
            },
          }}
        />
      </IconButton>
    </Box>
  );
};

export default CampaignsViewToggle;
