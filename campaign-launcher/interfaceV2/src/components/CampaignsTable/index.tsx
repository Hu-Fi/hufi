import { FC, MouseEvent } from 'react';

import { Button, IconButton, Typography, Box } from '@mui/material';
import { DataGrid, GridColDef, GridPagination } from '@mui/x-data-grid';
import { formatEther } from 'ethers';
import { useNavigate } from 'react-router-dom';

import { CampaignDataDto } from '../../api/client';
import { OpenInNewIcon } from '../../icons';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { formatAddress } from '../../utils';
import { CryptoPairEntity } from '../CryptoPairEntity';

type Props = {
  data: CampaignDataDto[];
  showPagination?: boolean;
  showAllCampaigns?: boolean;
  isJoinedCampaigns?: boolean;
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
}) => {
  const { exchanges } = useExchangesContext();
  const navigate = useNavigate();

  const campaigns =
    showAllCampaigns || showPagination ? data : data.slice(0, 3);

  const handleAddressClick = (e: MouseEvent<HTMLButtonElement>, address: string) => {
    e.stopPropagation();
    window.open(`https://polygonscan.com/address/${address}`, '_blank');
  };

  const columns: GridColDef[] = [
    {
      field: 'paddingLeft',
      headerName: '',
      flex: 1,
      maxWidth: 32,
    },
    {
      field: 'pair',
      headerName: 'Pair',
      flex: 2.5,
      renderCell: (params) => <CryptoPairEntity symbol={params.row.symbol} size="medium" />,
    },
    {
      field: 'exchange',
      headerName: 'Exchange',
      flex: 2.5,
      renderCell: (params) => {
        const exchangeLogo = exchanges?.find(
          (exchange) => exchange.name === params.row.exchangeName
        )?.logo;
        const exchangeName = exchanges?.find(
          (exchange) => exchange.name === params.row.exchangeName
        )?.displayName;
        return (
          <Typography display="flex" alignItems="center" gap={1}>
            <img src={exchangeLogo} alt={exchangeName} width={85} height={25} />
            {exchangeName}
          </Typography>
        );
      },
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 2,
      renderCell: (params) => {
        return (
          <Typography variant="subtitle2" display="flex" alignItems="center">
            {formatAddress(params.row.address)}
            <IconButton
              onClick={(e) => handleAddressClick(e,params.row.address)}
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
      renderCell: (params) => {
        return <Typography variant="subtitle2">{formatDate(params.row.startBlock)}</Typography>;
      },
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 2,
      renderCell: (params) => {
        return <Typography variant="subtitle2">{formatDate(params.row.endBlock)}</Typography>;
      },
    },
    {
      field: 'fundAmount',
      headerName: 'Fund Amount',
      flex: 2,
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
      flex: 1,
      maxWidth: 32,
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
      rowHeight={114}
      disableColumnMenu
      disableColumnSelector
      disableColumnFilter
      disableColumnSorting
      disableColumnResize
      disableRowSelectionOnClick
      getRowSpacing={({ isLastVisible }) => ({ bottom: isLastVisible ? 0 : 8 })}
      pageSizeOptions={[5, 25, 50]}
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
        pagination: () => (
          <CustomPagination
            showPagination={showPagination}
            showAllCampaigns={showAllCampaigns}
            onViewAllClick={onViewAllClick}
          />
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
          mt: '15px',
        },
      }}
    />
  );
};

export default CampaignsTable;
