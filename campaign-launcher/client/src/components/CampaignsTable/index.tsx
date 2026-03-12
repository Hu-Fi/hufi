import type { FC } from 'react';

import { Box, Button, IconButton, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useLocation, useNavigate } from 'react-router';
import { useConnection } from 'wagmi';

import CampaignSymbol from '@/components/CampaignSymbol';
import FormattedNumber from '@/components/FormattedNumber';
import LaunchCampaignButton from '@/components/LaunchCampaignButton';
import { useCampaignTimeline } from '@/hooks/useCampaignTimeline';
import { ArrowLeftIcon } from '@/icons';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { useSignerContext } from '@/providers/SignerProvider';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import type { Campaign } from '@/types';
import {
  formatTokenAmount,
  getDailyTargetTokenSymbol,
  getTargetInfo,
  getTokenInfo,
  mapTypeToLabel,
} from '@/utils';

type Props = {
  data: Campaign[] | undefined;
  isFetching?: boolean;
  isJoinedCampaigns?: boolean;
  isMyCampaigns?: boolean;
};

const CampaignTimelineCell: FC<{ campaign: Campaign }> = ({ campaign }) => {
  const campaignTimeline = useCampaignTimeline(campaign);

  return (
    <Box display="flex" flexDirection="column">
      <Typography variant="caption" fontWeight={500} letterSpacing={0.15}>
        {campaignTimeline.label}
      </Typography>
      <Typography component="p" variant="subtitle2">
        {campaignTimeline.value}
      </Typography>
    </Box>
  );
};

const MyCampaignsNoRows: FC = () => {
  const { isSignerReady } = useSignerContext();

  if (!isSignerReady) {
    return (
      <>
        <Typography variant="subtitle2" component="p">
          To see your campaigns please connect your wallet
        </Typography>
      </>
    );
  }

  return (
    <>
      <Typography variant="subtitle2" component="p">
        At the moment you are not running any campaign.
      </Typography>
      <LaunchCampaignButton size="large" />
    </>
  );
};

const JoinedCampaignsNoRows: FC = () => {
  const { isAuthenticated } = useWeb3Auth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHomePage = pathname === '/';

  if (isAuthenticated) {
    return (
      <>
        <Typography variant="subtitle2" component="p">
          At the moment you are not participating in any campaign, please see
          all campaigns to participate.
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
    );
  }

  return (
    <Typography variant="subtitle2" component="p">
      To see joined campaigns please sign in
    </Typography>
  );
};

const CampaignsTable: FC<Props> = ({
  data,
  isFetching = false,
  isJoinedCampaigns = false,
  isMyCampaigns = false,
}) => {
  const { exchangesMap } = useExchangesContext();
  const navigate = useNavigate();
  const { isConnected } = useConnection();

  const isAllCampaigns = !isJoinedCampaigns && !isMyCampaigns;

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
      minWidth: 230,
      renderCell: (params) => {
        return (
          <Box display="flex" flexDirection="column" color="white">
            <CampaignSymbol
              symbol={params.row.symbol}
              campaignType={params.row.type}
              size="medium"
            />
            <Typography
              variant="caption"
              color="#a39fbc"
              textTransform="uppercase"
              fontWeight={600}
              letterSpacing={0}
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
      minWidth: 140,
      renderCell: (params) => {
        const exchangeName = exchangesMap.get(
          params.row.exchange_name
        )?.display_name;
        return <Typography>{exchangeName}</Typography>;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => <CampaignTimelineCell campaign={params.row} />,
    },
    {
      field: 'target',
      headerName: 'Target',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const targetToken = getDailyTargetTokenSymbol(
          params.row.type,
          params.row.symbol
        );
        const { label: targetTokenSymbol } = getTokenInfo(targetToken);
        return (
          <Typography
            component="p"
            variant="subtitle2"
            color="white"
            fontSize={16}
            fontWeight={700}
          >
            {getTargetInfo(params.row).value} {targetTokenSymbol}
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
            <Typography variant="body1" color="white" fontWeight={700}>
              <span>{fund_amount}</span> <span>{fund_token.toUpperCase()}</span>
            </Typography>
          );
        }

        const { fund_amount, fund_token_decimals, fund_token_symbol } =
          params.row;

        return (
          <Typography variant="body1" color="white" fontWeight={600}>
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
      flex: 1,
      minWidth: 170,
      renderCell: (params) => {
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            flex={1}
            gap={1}
          >
            <IconButton
              disableRipple
              sx={{
                width: 42,
                height: 42,
                p: 0,
                borderRadius: '4px',
                border: '1px solid #433679;',
              }}
              onClick={() =>
                navigate(`/campaign-details/${params.row.address}`)
              }
            >
              <ArrowLeftIcon sx={{ transform: 'rotate(135deg)' }} />
            </IconButton>
            {isConnected && (
              <Button
                variant="contained"
                size="large"
                color="error"
                sx={{ width: 120 }}
              >
                Join
              </Button>
            )}
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
      scrollbarSize={0}
      disableColumnMenu
      disableColumnSelector
      disableColumnFilter
      disableColumnSorting
      disableColumnResize
      disableRowSelectionOnClick
      disableVirtualization
      hideFooter
      hideFooterPagination
      slots={{
        noRowsOverlay: () => (
          <Box
            display="flex"
            width="100%"
            height="184px"
            alignItems="center"
            justifyContent="center"
            flexDirection={{ xs: 'column', md: 'row' }}
            textAlign="center"
            py={{ xs: 4, xl: 8 }}
            px={2}
            gap={5}
          >
            {isMyCampaigns && <MyCampaignsNoRows />}
            {isJoinedCampaigns && <JoinedCampaignsNoRows />}
            {isAllCampaigns && (
              <Typography variant="subtitle2" component="p">
                No campaigns found
              </Typography>
            )}
          </Box>
        ),
      }}
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
          '&[data-field="action"] .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: 'center',
          },
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
