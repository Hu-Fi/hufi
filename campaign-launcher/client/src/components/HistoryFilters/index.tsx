import { type FC } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';

import { HistoryViewFilter } from '@/types';

const filters = [
  { label: 'All', value: HistoryViewFilter.ALL },
  { label: 'Joined', value: HistoryViewFilter.JOINED },
  { label: 'Hosted', value: HistoryViewFilter.HOSTED },
];

type Props = {
  selectedFilter: HistoryViewFilter;
  setSelectedFilter: (filter: HistoryViewFilter) => void;
  isDisabled: boolean;
};

const HistoryFilters: FC<Props> = ({
  selectedFilter,
  setSelectedFilter,
  isDisabled,
}) => {
  return (
    <FormControl sx={{ mb: 4 }}>
      <RadioGroup
        value={selectedFilter}
        row
        sx={{ gap: 1.5 }}
        onChange={(_, value) =>
          !isDisabled && setSelectedFilter(value as HistoryViewFilter)
        }
      >
        {filters.map(({ label, value }) => (
          <FormControlLabel
            key={value}
            value={value}
            control={
              <Radio
                disableRipple
                sx={{ p: 0 }}
                disabled={isDisabled}
                icon={
                  <Box
                    width={20}
                    height={20}
                    borderRadius="50%"
                    border="1.5px solid #6d6d6d"
                    bgcolor="transparent"
                  />
                }
                checkedIcon={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width={20}
                    height={20}
                    borderRadius="50%"
                    bgcolor="error.main"
                  >
                    <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                  </Box>
                }
              />
            }
            label={
              <Typography
                color="white"
                fontSize={16}
                fontWeight={500}
                lineHeight={1}
              >
                {label}
              </Typography>
            }
            sx={{
              m: 0,
              gap: 0.75,
              alignItems: 'center',
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default HistoryFilters;
