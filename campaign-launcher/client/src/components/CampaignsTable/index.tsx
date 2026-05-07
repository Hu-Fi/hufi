import type { FC } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router';

import CampaignAddress from '@/components/CampaignAddress';
import CampaignSymbol from '@/components/CampaignSymbol';
import CampaignTimeline from '@/components/CampaignTimeline';
import CompactNumberWithTooltip from '@/components/CompactNumberWithTooltip';
import CustomTooltip from '@/components/CustomTooltip';
import FormattedNumber from '@/components/FormattedNumber';
import JoinCampaignButton from '@/components/JoinCampaignButton';
import { ArrowLeftIcon } from '@/icons';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import type { Campaign, JoinedCampaign } from '@/types';
import {
  formatTokenAmount,
  getChainIcon,
  getDailyTargetTokenSymbol,
  getNetworkName,
  getTargetInfo,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';

type Props = {
  data: Campaign[] | JoinedCampaign[] | undefined;
  isFetching?: boolean;
  isJoinedCampaigns?: boolean;
};

const CampaignsTable: FC<Props> = ({
  data,
  isFetching = false,
  isJoinedCampaigns = false,
}) => {
  const { exchangesMap } = useExchangesContext();
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    {
      field: 'paddingLeft',
      headerName: '',
      minWidth: 24,
      maxWidth: 24,
      width: 24,
      renderCell: () => null,
      renderHeader: () => null,
    },
    {
      field: 'campaign',
      headerName: 'Campaign',
      flex: 1.5,
      minWidth: 210,
      renderCell: (params) => {
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              color: 'white',
            }}
          >
            <CampaignSymbol
              symbol={params.row.symbol}
              campaignType={params.row.type}
              size="medium"
            />
            <Typography
              variant="caption"
              sx={{
                color: '#a39fbc',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: 0,
              }}
            >
              {mapTypeToLabel(params.row.type)}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'exchange',
      headerName: 'Exchange',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const exchangeName =
          exchangesMap.get(params.row.exchange_name)?.display_name ||
          params.row.exchange_name;
        return (
          <Typography
            sx={{
              color: 'white',
              textTransform: 'capitalize',
            }}
          >
            {exchangeName}
          </Typography>
        );
      },
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const { chain_id, address } = params.row;
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '& > a': { color: 'white', fontSize: '16px' },
            }}
          >
            <CustomTooltip
              arrow
              title={getNetworkName(chain_id) || 'Unknown Network'}
              placement="top"
            >
              <Box
                sx={{
                  display: 'flex',
                  '& > svg': { fontSize: '20px', color: 'white' },
                }}
              >
                {getChainIcon(chain_id)}
              </Box>
            </CustomTooltip>
            <CampaignAddress
              address={address}
              chainId={chain_id}
              size="medium"
            />
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <CampaignTimeline campaign={params.row} direction="column" />
      ),
    },
    {
      field: 'target',
      headerName: 'Target',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const targetToken = getDailyTargetTokenSymbol(
          params.row.type,
          params.row.symbol
        );
        const { label: targetTokenSymbol } = getTokenInfo(targetToken);
        const targetValue = getTargetInfo(params.row).value;
        return (
          <Typography
            component="p"
            variant="subtitle2"
            sx={{
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <CompactNumberWithTooltip value={targetValue} /> {targetTokenSymbol}
          </Typography>
        );
      },
    },
    {
      field: 'reward',
      headerName: 'Reward',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        if (isJoinedCampaigns) {
          const { fund_amount, fund_token } = params.row;
          return (
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                fontWeight: 700,
              }}
            >
              <span>{fund_amount}</span> <span>{fund_token.toUpperCase()}</span>
            </Typography>
          );
        }

        const { fund_amount, fund_token_decimals, fund_token_symbol } =
          params.row;

        return (
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              fontWeight: 600,
            }}
          >
            <FormattedNumber
              value={formatTokenAmount(fund_amount, fund_token_decimals)}
              suffix={` ${fund_token_symbol}`}
            />
          </Typography>
        );
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.5,
      minWidth: 130,
      renderCell: (params) => {
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              flex: 1,
              gap: 1,
              '& > :nth-of-type(2)': { width: 75 },
            }}
          >
            <IconButton
              disableRipple
              sx={{
                width: 42,
                height: 42,
                p: 0,
                borderRadius: '4px',
                border: '1px solid #433679',
              }}
              onClick={() =>
                navigate(`/campaign-details/${params.row.address}`)
              }
            >
              <ArrowLeftIcon sx={{ transform: 'rotate(135deg)' }} />
            </IconButton>
            <JoinCampaignButton campaign={params.row} />
          </Box>
        );
      },
    },
    {
      field: 'paddingRight',
      headerName: '',
      minWidth: 24,
      maxWidth: 24,
      width: 24,
      renderCell: () => null,
      renderHeader: () => null,
    },
  ];

  return (
    <DataGrid
      rows={data || []}
      columns={columns}
      columnHeaderHeight={72}
      rowHeight={92}
      getRowId={(row) => row.address}
      scrollbarSize={0}
      disableColumnMenu
      disableColumnSelector
      disableColumnFilter
      disableColumnSorting
      disableColumnResize
      disableRowSelectionOnClick
      hideFooter
      hideFooterPagination
      loading={isFetching}
      sx={{
        border: 'none',
        borderRadius: '18px',
        opacity: isFetching ? 0.5 : 1,
        bgcolor: '#251d47',
        '& .MuiDataGrid-withBorderColor': {
          border: 'none !important',
        },
        '& .MuiDataGrid-columnSeparator': {
          display: 'none',
        },
        '& .MuiDataGrid-filler': {
          display: 'none',
        },
        '& .MuiDataGrid-overlayWrapperInner': {
          height: '184px !important',
        },
        '& .MuiDataGrid-columnHeaders': {
          bgcolor: 'transparent',
          '& > div[role="row"]': {
            bgcolor: 'inherit',
          },
        },
        '& .MuiDataGrid-columnHeader': {
          py: 0,
          px: 0,
          textTransform: 'uppercase',
          cursor: 'default',
          bgcolor: 'transparent',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          color: '#716c8b',
          fontWeight: 600,
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: '1.5px',
        },
        '& .MuiDataGrid-row': {
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          mb: 0,
          py: 2,
          bgcolor: 'transparent',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: 'transparent',
          },
        },
        '& .MuiDataGrid-row--lastVisible': {
          mb: 0,
        },
        '& .MuiDataGrid-cell': {
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          outline: 'none',
          height: '60px',
          py: 0,
          px: 0,
          '& > p': {
            fontWeight: 600,
          },
        },
        '& .MuiDataGrid-cellEmpty': {
          display: 'none',
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within':
          {
            outline: 'none',
          },
      }}
    />
  );
};

export default CampaignsTable;
