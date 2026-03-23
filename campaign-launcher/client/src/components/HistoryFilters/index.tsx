import { type FC } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import { Box, Checkbox, Stack, styled, Typography } from '@mui/material';

import { HistoryViewFilter } from '@/types';

const filters = [
  { label: 'All', value: HistoryViewFilter.ALL },
  { label: 'Joined', value: HistoryViewFilter.JOINED },
  { label: 'Hosted', value: HistoryViewFilter.HOSTED },
];

const FilterButton = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
});

const CheckboxIcon = () => (
  <Box
    width={20}
    height={20}
    borderRadius="6px"
    border="1.5px solid #6d6d6d"
    bgcolor="transparent"
  />
);

const CheckboxCheckedIcon = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    width={20}
    height={20}
    borderRadius="6px"
    bgcolor="error.main"
  >
    <CheckIcon sx={{ color: '#ffffff', fontSize: 16 }} />
  </Box>
);

type Props = {
  selectedFilter: HistoryViewFilter;
  setSelectedFilter: (filter: HistoryViewFilter) => void;
};

const HistoryFilters: FC<Props> = ({ selectedFilter, setSelectedFilter }) => {
  return (
    <Stack direction="row" gap={1.5} mb={4}>
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.value;
        return (
          <FilterButton
            key={filter.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setSelectedFilter(filter.value)}
          >
            <Checkbox
              checked={isSelected}
              disableRipple
              icon={<CheckboxIcon />}
              checkedIcon={<CheckboxCheckedIcon />}
              sx={{ p: 0 }}
            />
            <Typography fontSize={16} fontWeight={500} lineHeight={1}>
              {filter.label}
            </Typography>
          </FilterButton>
        );
      })}
    </Stack>
  );
};

export default HistoryFilters;
