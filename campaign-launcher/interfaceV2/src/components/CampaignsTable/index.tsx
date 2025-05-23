import { FC, MouseEvent } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Button, IconButton, Typography, Box, useMediaQuery } from '@mui/material';
import { DataGrid, GridColDef, GridPagination } from '@mui/x-data-grid';
import { formatEther } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { CampaignDataDto } from '../../api/client';
import { MQ_MOBILE } from '../../constants';
import { OpenInNewIcon } from '../../icons';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { formatAddress, getExplorerUrl } from '../../utils';
import ConnectWallet from '../ConnectWallet';
import { CryptoPairEntity } from '../CryptoPairEntity';
import LaunchCampaign from '../LaunchCampaign';

type Props = {
  data: CampaignDataDto[] | undefined;
  showPagination?: boolean;
  showAllCampaigns?: boolean;
  isJoinedCampaigns?: boolean;
  isMyCampaigns?: boolean;
  onViewAllClick?: () => void;
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

const formatDate = (block: number) => {
  const date = new Date(block * 1000);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${getSuffix(day)} ${month} ${year}`;
};

const MyCampaignsNoRows: FC = () => {
  const { isConnected } = useAccount();

  if (isConnected) {
    return (
      <>
        <Typography variant="subtitle2" component="p">
          At the moment you are not running any campaign.
        </Typography>
        <LaunchCampaign variant="contained" />
      </>
    )
  }

  return (
    <>
      <Typography variant="subtitle2" component="p">
        To see your campaigns please connect your wallet
      </Typography>
      <ConnectWallet />
    </>
  )
}

const JoinedCampaignsNoRows: FC = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

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
            height: '42px',
            bgcolor: 'primary.main',
            color: 'primary.contrast', 
            fontWeight: 600,
          }}
          onClick={() => navigate('/all-campaigns')}
        >
          All Campaigns
        </Button>
      </>
    )
  }

  return (
    <>
      <Typography variant="subtitle2" component="p">
        To see joined campaigns please connect your wallet
      </Typography>
      <ConnectWallet />
    </>
  )
}

const CustomPagination: FC<{
  showPagination: boolean;
  showAllCampaigns: boolean;
  onViewAllClick?: () => void;
}> = ({ showPagination, showAllCampaigns, onViewAllClick }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
    >
      {!showAllCampaigns && (
        <Button
          variant="contained"
          size="medium"
          sx={{ color: 'primary.contrast', fontWeight: 600 }}
          onClick={onViewAllClick}
        >
          View All
        </Button>
      )}
      {showPagination && <GridPagination />}
    </Box>
  );
};

const CampaignsTable: FC<Props> = ({
  data,
  onViewAllClick,
  showPagination = false,
  showAllCampaigns = true,
  isJoinedCampaigns = false,
  isMyCampaigns = false,
}) => {
  const { exchanges } = useExchangesContext();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MQ_MOBILE);

  const isAllCampaigns = !isJoinedCampaigns && !isMyCampaigns;

  const campaigns =
    showAllCampaigns || showPagination ? data : data?.slice(0, 3);

  const handleAddressClick = (
    e: MouseEvent<HTMLButtonElement>,
    chainId: ChainId,
    address: string
  ) => {
    e.stopPropagation();
    const explorerUrl = getExplorerUrl(chainId, address);
    window.open(explorerUrl, '_blank');
  };

  const columns: GridColDef[] = [
    {
      field: 'paddingLeft',
      headerName: '',
      minWidth: isMobile ? 16 : 32,
      maxWidth: isMobile ? 16 : 32,
      width: isMobile ? 16 : 32,
      renderCell: () => null,
      renderHeader: () => null,
    },
    {
      field: 'pair',
      headerName: 'Pair',
      flex: 2,
      minWidth: 250,
      renderCell: (params) => <CryptoPairEntity symbol={params.row.symbol} size="medium" />,
    },
    {
      field: 'exchange',
      headerName: 'Exchange',
      flex: 1.5,
      minWidth: 170,
      renderCell: (params) => {
        const exchangeName = exchanges?.find(
          (exchange) => exchange.name === params.row.exchangeName
        )?.displayName;
        return (
          <Typography display="flex" alignItems="center" gap={1}>
            {/* <img src={exchangeLogo} alt={exchangeName} width={85} height={25} /> */}
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
      renderCell: (params) => {
        return (
          <Typography variant="subtitle2" display="flex" alignItems="center">
            {formatAddress(params.row.address)}
            <IconButton
              onClick={(e) =>
                handleAddressClick(e, params.row.chainId, params.row.address)
              }
              sx={{
                color: 'text.secondary',
                ml: 1,
                p: 0,
                '&:hover': { background: 'none' },
              }}
            >
              <OpenInNewIcon />
            </IconButton>
          </Typography>
        );
      },
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 2,
      minWidth: 125,
      renderCell: (params) => {
        return <Typography variant="subtitle2">{formatDate(params.row.startBlock)}</Typography>;
      },
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 2,
      minWidth: 125,
      renderCell: (params) => {
        return <Typography variant="subtitle2">{formatDate(params.row.endBlock)}</Typography>;
      },
    },
    {
      field: 'fundAmount',
      headerName: 'Fund Amount',
      flex: 2,
      minWidth: 150,
      renderCell: (params) => {
        return (
          <Typography variant="subtitle2">{formatEther(params.row.fundAmount)} HMT</Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const isActive =
          params.row.status === 'Pending' || params.row.status === 'Partial';
        return (
          <Typography variant="subtitle2" color={isActive ? 'success.main' : 'error.main'} textTransform="uppercase">
            {isActive ? 'Active' : params.row.status}
          </Typography>
        );
      },
    },
    {
      field: 'paddingRight',
      headerName: '',
      minWidth: isMobile ? 16 : 32,
      maxWidth: isMobile ? 16 : 32,
      width: isMobile ? 16 : 32,
      renderCell: () => null,
      renderHeader: () => null,
    },
  ];

  return (
    <DataGrid
      rows={campaigns}
      columns={columns}
      columnVisibilityModel={{
        status: !isJoinedCampaigns,
      }}
      columnHeaderHeight={48}
      rowHeight={data && data.length > 0 ? 114 : 95}
      scrollbarSize={0}
      disableColumnMenu
      disableColumnSelector
      disableColumnFilter
      disableColumnSorting
      disableColumnResize
      disableRowSelectionOnClick
      getRowSpacing={({ isLastVisible }) => ({ bottom: isLastVisible ? 0 : 8 })}
      pageSizeOptions={[5, 25, 50]}
      disableVirtualization={!data}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 5,
          },
        },
      }}
      onRowClick={(params) => {
        navigate(
          `/campaign-detail/${params.row.chainId}/${params.row.address}`
        );
      }}
      slots={{
        pagination: data && data.length > 0 ? () => (
          <CustomPagination
            showPagination={showPagination}
            showAllCampaigns={showAllCampaigns}
            onViewAllClick={onViewAllClick}
          />
        ) : null,
        noRowsOverlay: () => (
          <Box 
            display="flex" 
            width="100%"
            height="190px"
            alignItems="center"
            justifyContent="center"
            flexDirection={{ xs: "column", md: "row" }}
            textAlign="center"
            py={{ xs: 2, md: 8 }}
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
          height: '190px !important',
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
          p: 0,
          textTransform: 'uppercase',
          cursor: 'default',
          fontWeight: 500,
          fontSize: '16px',
          '&[data-field="fundAmount"] .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: isJoinedCampaigns ? 'flex-end' : 'flex-start',
          },
          '&[data-field="status"] .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: 'flex-end',
          },
        },
        '& .MuiDataGrid-row': {
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 1,
          py: 4,
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
          p: 0,
          '& > p': {
            fontWeight: 600,
          },
          '&[data-field="fundAmount"]': {
            justifyContent: isJoinedCampaigns ? 'flex-end' : 'flex-start',
          },
          '&[data-field="status"]': {
            justifyContent: 'flex-end',
          },
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within': {
          outline: 'none',
        },
        '& .MuiDataGrid-footerContainer': {
          display: data && data.length > 0 ? 'flex' : 'none',
          mt: '15px',
        },
      }}
    />
  );
};

export default CampaignsTable;
