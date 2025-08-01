import { FC, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { DeleteIcon, EditIcon } from '../../icons';
import { ExchangeApiKeyData } from '../../types';
import DeleteApiKeyModal from '../modals/DeleteApiKeyModal';
import EditApiKeyModal from '../modals/EditApiKeyModal';

type ApiKeysTableProps = {
  data: ExchangeApiKeyData[] | undefined;
};

const ApiKeysTable: FC<ApiKeysTableProps> = ({ data }) => {
  const [editingItem, setEditingItem] = useState('');
  const [deletingItem, setDeletingItem] = useState('');

  const handleClickOnEdit = (exchangeName: string) => {
    setEditingItem(exchangeName);
  }

  const handleClickOnDelete = (exchangeName: string) => {
    setDeletingItem(exchangeName);
  }

  const handleCloseEditModal = () => {
    setEditingItem('');
  }

  const handleCloseDeleteModal = () => {
    setDeletingItem('');
  }

  const rows = data?.map(({ exchange_name, api_key }) => ({
    id: exchange_name,
    exchangeName: exchange_name,
    apiKey: api_key,
  }));

  const columns: GridColDef[] = [
    { 
      field: 'exchangeName', 
      headerName: 'Exchange', 
      width: 160, 
      renderCell: (params) => {
        return (
          <Typography 
            display="flex" 
            alignItems="center" 
            variant="body1" 
            textTransform="capitalize"
          >
            {params.row.exchangeName}
          </Typography>
        );
      },
    },
    { 
      field: 'apiKey', 
      headerName: 'API Key', 
      flex: 1,
      renderCell: (params) => {
        return (
          <Typography display="flex" alignItems="center" variant="body1">
            {params.row.apiKey}
          </Typography>
        );
      },
    },
    { 
      field: 'actions', 
      headerName: '', 
      width: 64,
      renderCell: (params) => {
        return (
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              sx={{ p: 0 }} 
              disableRipple 
              onClick={() => handleClickOnEdit(params.row.exchangeName)}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              sx={{ p: 0 }} 
              disableRipple 
              onClick={() => handleClickOnDelete(params.row.exchangeName)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      }
    },
  ];

  return (
    <Box flexGrow={1}>
      <DataGrid 
        columns={columns}
        rows={rows}
        columnHeaderHeight={52}
        scrollbarSize={0}
        disableColumnFilter
        disableColumnMenu
        disableColumnResize
        disableColumnSorting
        disableColumnSelector
        disableRowSelectionOnClick
        disableVirtualization
        pageSizeOptions={[5, 10, 50]}
        hideFooter={!rows || rows?.length < 6}
        getRowHeight={() => 'auto'}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-main': {
            p: 4,
            borderRadius: '16px',
            width: '100%',
            height: '450px',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%), #100735',
          },
          '& .MuiDataGrid-cell': {
            borderTop: 'none',
            p: 2,
            overflow: 'visible !important',
            '&[data-field="actions"]': {
              px: 0,
            },
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'rgba(255, 255, 255, 0.12) !important',
            fontSize: '12px',
            p: 2,
            overflow: 'visible !important',
            textTransform: 'uppercase',
            borderBottom: 'none !important',
          },
          '& .MuiDataGrid-row': {
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          },
          '& .MuiDataGrid-footerContainer': {
            border: 'none',
          },
          '& .MuiDataGrid-columnSeparator--sideRight, & .MuiDataGrid-filler': {
            display: 'none',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
        }}
      />
      <EditApiKeyModal
        open={!!editingItem}
        onClose={handleCloseEditModal}
        exchangeName={editingItem}
      />
      <DeleteApiKeyModal
        open={!!deletingItem}
        onClose={handleCloseDeleteModal}
        exchangeName={deletingItem}
      />
    </Box>
  );
};

export default ApiKeysTable;
