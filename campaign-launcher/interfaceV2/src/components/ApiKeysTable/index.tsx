import { FC, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { DeleteIcon, EditIcon } from '../../icons';
import { ApiKeyData } from '../../types';
import DeleteApiKeyModal from '../modals/DeleteApiKeyModal';
import EditApiKeyModal from '../modals/EditApiKeyModal';

type ApiKeysTableProps = {
  data: Record<string, ApiKeyData>;
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

  const rows = Object.entries(data).map(([exchangeName, apiKeyData]) => ({
    id: apiKeyData.api_key,
    exchangeName,
    apiKey: apiKeyData.api_key,
    secretKey: apiKeyData.secret_key,
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
        rowHeight={56 + 4}
        columnHeaderHeight={52}
        scrollbarSize={0}
        disableColumnFilter
        disableColumnMenu
        disableColumnResize
        disableColumnSorting
        disableColumnSelector
        disableRowSelectionOnClick
        disableVirtualization
        hideFooter
        getRowSpacing={() => ({
          top: 4,
          bottom: 0,
        })}
        sx={{
          border: 'none',
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
          '& .MuiDataGrid-columnSeparator--sideRight': {
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
        keysData={data[editingItem]}
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
