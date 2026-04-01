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
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useActiveAccount } from '@/providers/ActiveAccountProvider';
import { type LeaderboardEntry } from '@/types';

import LeaderboardList from './List';

type Props = {
  open: boolean;
  onClose: () => void;
  data: LeaderboardEntry[];
  symbol: string;
};

const LeaderboardOverlay: FC<Props> = ({ open, onClose, data, symbol }) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const isMobile = useIsMobile();
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
      <Stack height="100%" minHeight={0}>
        <Box
          px={{ xs: 2, md: 4 }}
          pt={{ xs: 2, md: 4 }}
          pb={{ xs: 2, md: 3 }}
          bgcolor="background.default"
          overflow="hidden"
        >
          <Typography
            component="h6"
            variant={isMobile ? 'h6' : 'h5'}
            color="white"
            fontWeight={700}
          >
            {`Leaderboard (${symbol})`}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search Wallet"
            value={search}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: 'white', fontSize: 24 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: '#382c6b',
                borderRadius: '28px',
                border: 'none',
                '& fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'white',
                opacity: 1,
              },
            }}
          />
        </Box>
        <LeaderboardList data={filteredData} activeAddress={activeAddress} />
      </Stack>
    </ResponsiveOverlay>
  );
};

export default LeaderboardOverlay;
