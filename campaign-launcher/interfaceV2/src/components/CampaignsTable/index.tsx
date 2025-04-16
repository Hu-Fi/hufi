import { FC } from 'react';

import { Button, IconButton, Typography, Box } from '@mui/material';
import { DataGrid, GridColDef, GridPagination } from '@mui/x-data-grid';
import { formatEther } from 'ethers';

import { CampaignDataDto } from '../../api/client';
import { OpenInNewIcon } from '../../icons';
import { useExchangesContext } from '../../providers/ExchangesProvider';
import { formatAddress } from '../../utils';

type Props = {
  data: CampaignDataDto[];
  withPagination?: boolean;
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

const CustomPagination: FC<{ withPagination: boolean }> = ({
  withPagination,
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
    >
      <Button
        variant="contained"
        size="medium"
        sx={{ color: 'primary.contrast', fontWeight: 600 }}
      >
        View All
      </Button>
      {withPagination && <GridPagination />}
    </Box>
  );
};

const CampaignsTable: FC<Props> = ({ data, withPagination = false }) => {
  const { exchanges } = useExchangesContext();

  const handleAddressClick = (address: string) => {
    window.open(`https://polygonscan.com/address/${address}`, '_blank');
  };

  const columns: GridColDef[] = [
    {
      field: 'pair',
      headerName: 'Pair',
      flex: 1,
      renderCell: (params) => {
        return (
          <Typography textTransform="uppercase" fontSize={20} fontWeight={700}>
            {params.row.symbol}
          </Typography>
        );
      },
    },
    {
      field: 'exchange',
      headerName: 'Exchange',
      flex: 1,
      renderCell: (params) => {
        const exchangeLogo = exchanges?.find(
          (exchange) => exchange.name === params.row.exchangeName
        )?.logo;
        const exchangeName = exchanges?.find(
          (exchange) => exchange.name === params.row.exchangeName
        )?.displayName;
        return (
          <Typography display="flex" alignItems="center" gap={1}>
            <img src={exchangeLogo} alt={exchangeName} />
            {exchangeName}
          </Typography>
        );
      },
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1,
      renderCell: (params) => {
        return (
          <Typography display="flex" alignItems="center">
            {formatAddress(params.row.address)}
            <IconButton
              onClick={() => handleAddressClick(params.row.address)}
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
      flex: 1,
      renderCell: (params) => {
        return <Typography>{formatDate(params.row.startBlock)}</Typography>;
      },
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1,
      renderCell: (params) => {
        return <Typography>{formatDate(params.row.endBlock)}</Typography>;
      },
    },
    {
      field: 'fundAmount',
      headerName: 'Fund Amount',
      flex: 1,
      renderCell: (params) => {
        return (
          <Typography>{formatEther(params.row.fundAmount)} HMT</Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        return (
          <Typography
            color={
              params.row.status === 'active' ? 'success.main' : 'error.main'
            }
          >
            {params.row.status}
          </Typography>
        );
      },
    },
  ];

  return (
    <DataGrid
      rows={data}
      columns={columns}
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
      slots={{
        pagination: () => <CustomPagination withPagination={withPagination} />,
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
          px: 4,
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
        },
        '& .MuiDataGrid-row': {
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 1,
          p: 4,
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
