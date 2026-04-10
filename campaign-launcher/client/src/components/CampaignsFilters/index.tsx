import { type FC, useState } from 'react';

import { IconButton, styled } from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { FilterIcon } from '@/icons';
import { type CampaignType } from '@/types';

import CampaignsFiltersContent from './Content';

const FiltersCountStyled = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#FA2A75',
  color: 'white',
  fontSize: 12,
  borderRadius: '50%',
});

export type CampaignsFiltersSelection = {
  campaignTypes: (CampaignType | 'all')[];
  exchanges: string[];
  network: number;
};

type Props = {
  appliedFilters: CampaignsFiltersSelection;
  handleApplyFilters: (filters: CampaignsFiltersSelection) => void;
  isDisabled: boolean;
};

const CampaignsFilters: FC<Props> = ({
  appliedFilters,
  handleApplyFilters,
  isDisabled,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filtersCount, setFiltersCount] = useState(0);

  const handleOpen = () => {
    setIsFiltersOpen(true);
  };

  const handleClose = () => {
    setIsFiltersOpen(false);
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
          bgcolor: 'background.default',
          width: 42,
          height: 42,
          border: '1px solid #251d47',
          borderRadius: '100%',
        }}
      >
        <FilterIcon />
        {filtersCount > 0 && (
          <FiltersCountStyled>{filtersCount}</FiltersCountStyled>
        )}
      </IconButton>
      <ResponsiveOverlay
        open={isFiltersOpen}
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
          isOpen={isFiltersOpen}
          appliedFilters={appliedFilters}
          onApplyFilters={handleApplyFilters}
          onAppliedFiltersCountChange={setFiltersCount}
          onClose={handleClose}
        />
      </ResponsiveOverlay>
    </>
  );
};

export default CampaignsFilters;
