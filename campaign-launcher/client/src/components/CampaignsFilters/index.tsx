import { type FC, useState } from 'react';

import { IconButton, styled } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { FilterIcon } from '@/icons';
import { type CampaignStatus, type CampaignType } from '@/types';

import CampaignsFiltersContent from './Content';

const FiltersCountStyled = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: theme.palette.accent.main,
  color: theme.palette.neutral['100'],
  fontSize: 12,
  borderRadius: '50%',
}));

export type CampaignsFiltersSelection = {
  network: number;
  statuses: (CampaignStatus | 'all')[];
  campaignTypes: (CampaignType | 'all')[];
  exchanges: string[];
};

type Props = {
  appliedFilters: CampaignsFiltersSelection;
  filtersCount: number;
  handleApplyFilters: (filters: CampaignsFiltersSelection) => void;
  isDisabled: boolean;
};

const CampaignsFilters: FC<Props> = ({
  appliedFilters,
  filtersCount,
  handleApplyFilters,
  isDisabled,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpen = () => {
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const _handleApplyFilters = (filters: CampaignsFiltersSelection) => {
    handleApplyFilters(filters);
    handleClose();
  };

  return (
    <>
      <IconButton
        disableRipple
        disabled={isDisabled}
        onClick={handleOpen}
        sx={{
          p: 0,
          position: 'relative',
          width: 42,
          height: 42,
          border: '1px solid',
          borderColor: 'border.strong',
          borderRadius: '100%',
        }}
      >
        <FilterIcon />
        {filtersCount > 0 && (
          <FiltersCountStyled>{filtersCount}</FiltersCountStyled>
        )}
      </IconButton>
      <ResponsiveOverlay
        open={isDialogOpen}
        onClose={handleClose}
        desktopSx={{
          pt: 6,
          pb: 0,
          px: 0,
          width: 680,
          height: 640,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        mobileSx={{
          pb: 0,
        }}
      >
        <CampaignsFiltersContent
          appliedFilters={appliedFilters}
          onApplyFilters={_handleApplyFilters}
        />
      </ResponsiveOverlay>
    </>
  );
};

export default CampaignsFilters;
