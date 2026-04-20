import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import FormattedNumber from '@/components/FormattedNumber';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { CampaignType, type EvmAddress, type LeaderboardEntry } from '@/types';
import { formatAddress, getCompactNumberParts } from '@/utils';

import MyEntryLabel from './MyEntryLabel';

type Props = {
  data: LeaderboardEntry[];
  activeAddress: EvmAddress | undefined;
  campaignType: CampaignType;
};

const LeaderboardList = memo(({ data, activeAddress, campaignType }: Props) => {
  const isMobile = useIsMobile();

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'rank',
        headerName: 'Rank',
        width: isMobile ? 55 : 100,
        renderCell: (params) => (
          <Typography variant="body2" color="white" fontWeight={500}>
            #{params.row.rank}
          </Typography>
        ),
      },
      {
        field: 'wallet',
        headerName: 'Wallet',
        flex: 1,
        minWidth: isMobile ? 120 : 200,
        renderCell: (params) => {
          const isMyEntry =
            params.row.address === activeAddress || params.row.rank === 7;
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="white" fontWeight={500}>
                {formatAddress(params.row.address, 4, 2)}
              </Typography>
              {isMyEntry && <MyEntryLabel />}
            </Box>
          );
        },
      },
      {
        field: 'reward',
        headerName: 'Reward',
        width: isMobile ? 60 : 100,
        renderCell: (params) => {
          const { value, suffix, decimals } = getCompactNumberParts(
            params.row.estimated_reward
          );
          return (
            <Typography variant="body2" color="white" fontWeight={500}>
              <FormattedNumber
                value={value}
                decimals={decimals}
                prefix="$"
                suffix={suffix}
              />
            </Typography>
          );
        },
      },
      {
        field: 'score',
        headerName: 'Score',
        width: isMobile ? 55 : 100,
        renderCell: (params) => {
          const { value, suffix, decimals } = getCompactNumberParts(
            params.row.score
          );
          return (
            <Typography variant="body2" color="white" fontWeight={500}>
              <FormattedNumber
                value={value}
                decimals={decimals}
                suffix={suffix}
              />
            </Typography>
          );
        },
      },
      {
        field: 'target',
        headerName:
          campaignType === CampaignType.MARKET_MAKING ? 'Volume' : 'Held',
        width: isMobile ? 75 : 100,
        renderCell: (params) => {
          const { value, suffix, decimals } = getCompactNumberParts(
            params.row.result
          );
          return (
            <Typography
              fontSize={14}
              lineHeight={1}
              color="white"
              fontWeight={500}
            >
              <FormattedNumber
                value={value}
                decimals={decimals}
                suffix={suffix}
              />
            </Typography>
          );
        },
      },
    ],
    [isMobile, activeAddress, campaignType]
  );

  return (
    <Box flex={1} minHeight={0} overflow="hidden" bgcolor="#251d47">
      <DataGrid
        rows={data}
        columns={columns}
        hideFooter
        disableColumnFilter
        disableColumnMenu
        disableColumnResize
        disableColumnSelector
        disableColumnSorting
        disableRowSelectionOnClick
        getRowHeight={() => 60}
        getRowId={(row) => row.address}
        getRowClassName={(params) => {
          const isMyEntry =
            params.row.address === activeAddress || params.row.rank === 7;
          return isMyEntry ? 'leaderboard-row--active' : '';
        }}
        sx={{
          width: '100%',
          border: 'none',
          bgcolor: 'inherit',
          '& .MuiDataGrid-columnHeaders': {
            borderBottom: '1px solid #3a2e6f',
          },
          '& .MuiDataGrid-columnHeader': {
            bgcolor: '#251d47',
            borderBottom: 'none !important',
            px: 0,
            pointerEvents: 'none',
            '&[data-field="rank"]': {
              pl: { xs: 2, md: 4 },
            },
            '&[data-field="target"]': {
              pr: { xs: 2, md: 4 },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                justifyContent: 'flex-end',
              },
            },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: { xs: 12, md: 14 },
            lineHeight: '100%',
            fontWeight: 500,
          },
          '& .MuiDataGrid-row': {
            borderBottom: '1px solid #3a2e6f',
            '&:hover': {
              bgcolor: 'transparent',
            },
            '&:last-of-type': {
              borderBottom: 'none',
            },
          },
          '& .MuiDataGrid-row.leaderboard-row--active': {
            bgcolor: '#3a2e6f',
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
            borderTop: 'none',
            borderBottom: 'none',
            px: 0,
            '&[data-field="rank"]': {
              pl: { xs: 2, md: 4 },
            },
            '&[data-field="target"]': {
              pr: { xs: 2, md: 4 },
              justifyContent: 'flex-end',
            },
            '&:focus, &:focus-within': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
            {
              outline: 'none',
            },
          '& .MuiDataGrid-columnSeparator--sideRight, & .MuiDataGrid-filler': {
            display: 'none',
          },
        }}
      />
    </Box>
  );
});

export default LeaderboardList;
