import { type FC, useMemo, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import DeleteApiKeyModal from '@/components/modals/DeleteApiKeyModal';
import EditApiKeyModal from '@/components/modals/EditApiKeyModal';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { DeleteIcon, EditIcon } from '@/icons';
import type { ExchangeApiKeyData } from '@/types';
import { formatAddress } from '@/utils';

type ApiKeysTableProps = {
  data: ExchangeApiKeyData[] | undefined;
};

const ApiKeysTable: FC<ApiKeysTableProps> = ({ data }) => {
  const [editingItem, setEditingItem] = useState('');
  const [deletingItem, setDeletingItem] = useState('');

  const isMobile = useIsMobile();

  const handleClickOnEdit = (exchangeName: string) => {
    setEditingItem(exchangeName);
  };

  const handleClickOnDelete = (exchangeName: string) => {
    setDeletingItem(exchangeName);
  };

  const handleCloseEditModal = () => {
    setEditingItem('');
  };

  const handleCloseDeleteModal = () => {
    setDeletingItem('');
  };

  const rows = data?.map(({ exchange_name, api_key, extras }) => ({
    id: exchange_name,
    exchangeName: exchange_name,
    apiKey: api_key,
    extras: extras,
  }));

  const longestApiKeyLength = useMemo(() => {
    return Math.max(...(data?.map(({ api_key }) => api_key.length) || [0]));
  }, [data]);

  const columns: GridColDef[] = [
    {
      field: 'exchangeName',
      headerName: 'Exchange',
      width: isMobile ? 130 : 160,
      renderCell: (params) => {
        return (
          <Typography
            display="flex"
            alignItems="center"
            variant={isMobile ? 'body2' : 'body1'}
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
      minWidth: isMobile ? 90 : longestApiKeyLength * 10 + 100,
      renderCell: (params) => {
        const isBitmart = params.row.exchangeName === 'bitmart';
        return (
          <Typography
            display="flex"
            alignItems="center"
            variant={isMobile ? 'body2' : 'body1'}
          >
            {isMobile ? formatAddress(params.row.apiKey) : params.row.apiKey}
            {isBitmart && !!params.row.extras?.api_key_memo && (
              <CustomTooltip
                arrow
                placement="left"
                title={
                  <Typography variant="tooltip">
                    Memo: {params.row.extras.api_key_memo}
                  </Typography>
                }
              >
                <InfoTooltipInner
                  sx={{
                    ml: 1,
                    width: '20px',
                    height: '20px',
                    px: 1,
                    bgcolor: 'background.default',
                    cursor: 'pointer',
                  }}
                />
              </CustomTooltip>
            )}
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: isMobile ? 82 : 64,
      renderCell: (params) => {
        return (
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              sx={{ p: 0 }}
              disableRipple
              onClick={() => handleClickOnEdit(params.row.exchangeName)}
            >
              <EditIcon sx={{ color: 'text.primary' }} />
            </IconButton>
            <IconButton
              sx={{ p: 0 }}
              disableRipple
              onClick={() => handleClickOnDelete(params.row.exchangeName)}
            >
              <DeleteIcon sx={{ color: 'text.primary' }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box width="100%" overflow="hidden">
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
            p: isMobile ? 0 : 4,
            borderRadius: '16px',
            width: '100%',
            height: '450px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%), #100735',
          },
          '& .MuiDataGrid-cell': {
            borderTop: 'none',
            p: 2,
            overflow: 'visible !important',
            '&[data-field="actions"]': {
              px: isMobile ? 1 : 0,
            },
          },
          '& .MuiDataGrid-cellEmpty': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'rgba(255, 255, 255, 0.12) !important',
            fontSize: '12px',
            fontWeight: 400,
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
