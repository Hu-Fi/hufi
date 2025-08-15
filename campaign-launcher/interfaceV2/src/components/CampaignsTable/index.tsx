import { FC } from 'react';

import { Button, Typography, Box, Tooltip, Stack } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { useIsXlDesktop, useIsLgDesktop } from '../../hooks/useBreakpoints';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { Campaign } from '../../types';
import { formatTokenAmount, getChainIcon, getNetworkName, mapStatusToColor } from '../../utils';
import { CryptoPairEntity } from '../CryptoPairEntity';
import ExplorerLink from '../ExplorerLink';
import InfoTooltipInner from '../InfoTooltipInner';
import LaunchCampaign from '../LaunchCampaign';

type Props = {
  data: Campaign[] | undefined;
  isJoinedCampaigns?: boolean;
  isMyCampaigns?: boolean;
};

const getSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${getSuffix(day)} ${month} ${year}`;
};

const MyCampaignsNoRows: FC = () => {
  return (
    <>
      <Typography variant="subtitle2" component="p">
        At the moment you are not running any campaign.
      </Typography>
      <LaunchCampaign variant="contained" />
    </>
  )
}

const JoinedCampaignsNoRows: FC = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHomePage = pathname === '/';

  if (isConnected) {
    return (
      <>
        <Typography variant="subtitle2" component="p">
          At the moment you are not participating in any campaign, please see all campaigns to participate.
        </Typography>
        <Button
          variant="contained"
          size="medium"
          sx={{ 
            display: isHomePage ? 'none' : 'inline-flex',
            height: '42px',
            bgcolor: 'primary.main',
            color: 'primary.contrast', 
          }}
          onClick={() => navigate('/')}
        >
          All Campaigns
        </Button>
      </>
    )
  }

  return (
    <Typography variant="subtitle2" component="p">
      To see joined campaigns please sign in
    </Typography>
  )
}

const statusTooltipData = [
  {
    status: 'Active',
    color: 'success.main',
  },
  {
    status: 'Awaiting start date',
    color: 'warning.main',
  },
  {
    status: 'Campaign is finished, waiting for payouts',
    color: 'error.main',
  },
  {
    status: 'Completed',
    color: 'secondary.main',
  },
  {
    status: 'Cancelled',
    color: 'primary.main',
    border: '1px solid',
    borderColor: 'white',
  },
]

const StatusTooltip = () => {
  return (
    <Tooltip 
      arrow 
      placement="left"
      title={
        <Stack gap={0.5}>
          {
            statusTooltipData.map((item) => (
              <Box key={item.status} display="flex" alignItems="center" gap={0.5}>
                <Box 
                  width="8px" 
                  height="8px" 
                  borderRadius="100%" 
                  bgcolor={item.color} 
                  border={item.border ? '1px solid' : 'none'} 
                  borderColor={item.borderColor ? item.borderColor : 'none'} 
                />
                <Typography variant="tooltip">{item.status}</Typography>
              </Box>
            ))
          }
        </Stack>
      }
    >
      <InfoTooltipInner />
    </Tooltip>
  )
}

const CampaignsTable: FC<Props> = ({
  data,
  isJoinedCampaigns = false,
  isMyCampaigns = false,
}) => {
  const { exchangesMap } = useExchangesContext();
  const navigate = useNavigate();
  const isLg = useIsLgDesktop();
  const isXl = useIsXlDesktop();

  const isAllCampaigns = !isJoinedCampaigns && !isMyCampaigns;

  const noRows = !(data && data.length > 0);

  const columns: GridColDef[] = [
    {
      field: 'paddingLeft',
      headerName: '',
      minWidth: isXl ? 32 : 16,
      maxWidth: isXl ? 32 : 16,
      width: isXl ? 32 : 16,
      renderCell: () => null,
      renderHeader: () => null,
    },
    {
      field: 'pair',
      headerName: 'Pair',
      flex: 2,
      minWidth: 250,
      renderCell: (params) => <CryptoPairEntity symbol={params.row.trading_pair} size="medium" />,
    },
    {
      field: 'exchange',
      headerName: 'Exchange',
      flex: 1.5,
      minWidth: 170,
      renderCell: (params) => {
        const exchangeName = exchangesMap.get(params.row.exchange_name)?.display_name;
        return (
          <Typography>
            {exchangeName}
          </Typography>
        );
      },
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1.5,
      minWidth: 175,
      renderCell: (params) => <ExplorerLink address={params.row.address} chainId={params.row.chain_id} />,
    },
    {
      field: 'network',
      headerName: 'Network',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => {
        const networkName = getNetworkName(params.row.chain_id);
        return (
          <Tooltip title={networkName || "Unknown Network"}>
            <Box display="flex" alignItems="center">
              {getChainIcon(params.row.chain_id)}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 2,
      minWidth: 135,
      renderCell: (params) => {
        return <Typography variant="subtitle2">{formatDate(params.row.start_date)}</Typography>;
      },
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 2,
      minWidth: 135,
      renderCell: (params) => {
        return <Typography variant="subtitle2">{formatDate(params.row.end_date)}</Typography>;
      },
    },
    {
      field: 'fundAmount',
      headerName: 'Fund Amount',
      flex: 2,
      minWidth: 150,
      renderCell: (params) => {
        if (isJoinedCampaigns) {
          const { fund_amount, fund_token } = params.row
          return (
            <Typography variant="subtitle2">
              <span>{fund_amount}</span>{' '}
              <span>{fund_token.toUpperCase()}</span>
            </Typography>
          )
        }
        const { fund_amount, fund_token_decimals, fund_token_symbol } = params.row;
        
        return (
          <Typography variant="subtitle2">
            {formatTokenAmount(fund_amount, fund_token_decimals)} {fund_token_symbol}
          </Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 80,
      renderHeader: () => <StatusTooltip />,
      renderCell: (params) => {
        return (
          <Box
            width="8px"
            height="8px"
            borderRadius="100%"
            bgcolor={mapStatusToColor(params.row.status, params.row.start_date, params.row.end_date)}
          />
        )
      },
    },
    {
      field: 'paddingRight',
      headerName: '',
      minWidth: isXl ? 32 : 16,
      maxWidth: isXl ? 32 : 16,
      width: isXl ? 32 : 16,
      renderCell: () => null,
      renderHeader: () => null,
    },
  ];

  return (
    <DataGrid
      rows={data || []}
      columns={columns}
      columnVisibilityModel={{
        status: !isJoinedCampaigns,
      }}
      columnHeaderHeight={48}
      rowHeight={noRows ? (isLg ? 50 : 95) : (isXl ? 114 : 95)}
      scrollbarSize={0}
      disableColumnMenu
      disableColumnSelector
      disableColumnFilter
      disableColumnSorting
      disableColumnResize
      disableRowSelectionOnClick
      getRowSpacing={({ isLastVisible }) => ({ bottom: isLastVisible ? 0 : 8 })}
      disableVirtualization={!data}
      hideFooter
      hideFooterPagination
      onRowClick={(params) => {
        navigate(
          `/campaign-details/${params.row.address}`
        );
      }}
      slots={{
        noRowsOverlay: () => (
          <Box 
            display="flex" 
            width="100%"
            height={{ xs: '190px', lg: '100px', xl: '190px' }}
            alignItems="center"
            justifyContent="center"
            flexDirection={{ xs: "column", md: "row" }}
            textAlign="center"
            py={{ xs: 4, xl: 8 }}
            px={2}
            gap={5}
            borderRadius="16px"
            bgcolor="background.default"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            {isMyCampaigns && <MyCampaignsNoRows />}
            {isJoinedCampaigns && <JoinedCampaignsNoRows />}
            {isAllCampaigns && <Typography variant="subtitle2" component="p">No campaigns found</Typography>}
          </Box>
        ),
      }}
      sx={{
        border: 'none',
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
          height: isLg ? '100px !important' : '190px !important',
        },
        '& .MuiDataGrid-topContainer': {
          mb: 1,
        },
        '& .MuiDataGrid-columnHeaders': {
          '& > div[role="row"]': {
            bgcolor: 'inherit',
          },
        },
        '& .MuiDataGrid-columnHeader': {
          py: 0,
          px: isXl ? 0 : 1,
          textTransform: 'uppercase',
          cursor: 'default',
          fontWeight: 500,
          fontSize: '16px',
          '&[data-field="fundAmount"] .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: isJoinedCampaigns ? 'flex-end' : 'flex-start',
          },
          '&[data-field="status"] .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: 'center',
          },
        },
        '& .MuiDataGrid-row': {
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 1,
          py: isXl ? 4 : 2,
          bgcolor: 'background.default',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        },
        '& .MuiDataGrid-row--lastVisible': {
          mb: 0,
        },
        '& .MuiDataGrid-cell': {
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          outline: 'none',
          height: '48px',
          py: 0,
          px: isXl ? 0 : 1,
          '& > p': {
            fontWeight: 600,
          },
          '&[data-field="fundAmount"]': {
            justifyContent: isJoinedCampaigns ? 'flex-end' : 'flex-start',
          },
          '&[data-field="status"], &[data-field="network"]': {
            justifyContent: 'center',
          },
        },
        '& .MuiDataGrid-cellEmpty': {
          display: 'none',
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within': {
          outline: 'none',
        },
      }}
    />
  );
};

export default CampaignsTable;
