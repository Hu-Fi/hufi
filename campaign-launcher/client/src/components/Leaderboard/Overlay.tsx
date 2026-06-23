import {
  type ChangeEvent,
  type FC,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { type CampaignType, type LeaderboardEntry } from '@/types';

import LeaderboardList from './List';

import { formatActualOnDate } from '.';

type Props = {
  open: boolean;
  onClose: () => void;
  data: LeaderboardEntry[];
  updatedAt: string;
  symbol: string;
  campaignType: CampaignType;
};

const LeaderboardOverlay: FC<Props> = ({
  open,
  onClose,
  data,
  updatedAt,
  symbol,
  campaignType,
}) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const { activeAddress } = useActiveAccount();

  const filteredData = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    if (!normalizedSearch) return data;

    return data.filter(({ address }) =>
      address.toLowerCase().includes(normalizedSearch)
    );
  }, [data, deferredSearch]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      desktopSx={{ p: 0, height: 650 }}
      mobileSx={{ p: 0 }}
      closeButtonSx={{
        top: { xs: 20, md: 32 },
        right: { xs: 16, md: 32 },
      }}
    >
      <Stack sx={{ height: '100%', minHeight: 0 }}>
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            pt: { xs: 2, md: 4 },
            pb: { xs: 2, md: 3 },
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          <Typography variant="h5" sx={{ color: 'neutral.100' }}>
            {`Leaderboard (${symbol})`}
          </Typography>
          <Typography variant="subtitle4" sx={{ mt: 0.5 }}>
            Actual on: {formatActualOnDate(updatedAt)}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search Wallet"
            value={search}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                'aria-label': 'Search Wallet',
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: 'neutral.100', fontSize: 24 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'neutral.100',
                bgcolor: 'border.strong',
                borderRadius: '28px',
                border: 'none',
                '& fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'neutral.100',
                opacity: 1,
              },
            }}
          />
        </Box>
        <LeaderboardList
          data={filteredData}
          activeAddress={activeAddress}
          campaignType={campaignType}
        />
      </Stack>
    </ResponsiveOverlay>
  );
};

export default LeaderboardOverlay;
