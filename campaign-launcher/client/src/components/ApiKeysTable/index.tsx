import { type FC, useMemo, useState } from 'react';

import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, IconButton, List, ListItem, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import DeleteApiKeyModal from '@/components/modals/DeleteApiKeyModal';
import EditApiKeyModal from '@/components/modals/EditApiKeyModal';
import { useRevalidateExchangeApiKey } from '@/hooks/recording-oracle/exchangeApiKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { DeleteIcon, EditIcon } from '@/icons';
import type { ExchangeApiKeyData } from '@/types';
import { formatAddress } from '@/utils';

type ApiKeysTableProps = {
  data: ExchangeApiKeyData[] | undefined;
};

const MissingPermissionsTooltip: FC<{ missingPermissions: string[] }> = ({
  missingPermissions,
}) => {
  const isMobile = useIsMobile();
  return (
    <CustomTooltip
      arrow
      placement={isMobile ? 'right' : 'top'}
      sx={{ height: 20 }}
      title={
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="tooltip">Missing permissions:</Typography>
          <List sx={{ p: 0, listStyle: 'disc' }}>
            {missingPermissions.map((permission: string) => (
              <ListItem key={permission} sx={{ px: 0, py: 0.5 }}>
                <Typography variant="tooltip" fontWeight={600}>
                  {permission}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      }
    >
      <ErrorIcon sx={{ color: 'error.main', fontSize: '20px' }} />
    </CustomTooltip>
  );
};

const ApiKeysTable: FC<ApiKeysTableProps> = ({ data }) => {
  const [editingItem, setEditingItem] = useState('');
  const [deletingItem, setDeletingItem] = useState('');

  const isMobile = useIsMobile();
  const { mutate: revalidateExchangeApiKey } = useRevalidateExchangeApiKey();

  const handleClickOnRefresh = (exchangeName: string) => {
    revalidateExchangeApiKey(exchangeName);
  };

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

  const rows = data?.map(
    ({ exchange_name, api_key, extras, is_valid, missing_permissions }) => ({
      id: exchange_name,
      exchangeName: exchange_name,
      apiKey: api_key,
      extras: extras,
      isValid: is_valid,
      missingPermissions: missing_permissions,
    })
  );

  const longestApiKeyLength = useMemo(() => {
    return Math.max(...(data?.map(({ api_key }) => api_key.length) || [0]));
  }, [data]);

  const columns: GridColDef[] = [
    {
      field: 'exchangeName',
      headerName: 'Exchange',
      width: isMobile ? 120 : 160,
      renderCell: (params) => {
        const { exchangeName, isValid, missingPermissions } = params.row;
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              textTransform="capitalize"
            >
              {exchangeName}
            </Typography>
            {!isValid && (
              <MissingPermissionsTooltip
                missingPermissions={missingPermissions}
              />
            )}
          </Box>
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
          <Box display="flex" alignItems="center">
            <Typography variant={isMobile ? 'body2' : 'body1'}>
              {isMobile ? formatAddress(params.row.apiKey) : params.row.apiKey}
            </Typography>
            {isBitmart && !!params.row.extras?.api_key_memo && (
              <CustomTooltip
                arrow
                placement="top"
                title={
                  <Typography variant="tooltip">
                    Memo: {params.row.extras.api_key_memo}
                  </Typography>
                }
                sx={{ ml: 1 }}
              >
                <InfoTooltipInner
                  sx={{
                    width: '20px',
                    height: '20px',
                    px: 1,
                    bgcolor: 'background.default',
                  }}
                />
              </CustomTooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: isMobile ? 110 : 96,
      renderCell: (params) => {
        return (
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton
              sx={{ p: 0 }}
              disableRipple
              onClick={() => handleClickOnRefresh(params.row.exchangeName)}
            >
              <RefreshIcon sx={{ color: 'text.primary' }} />
            </IconButton>
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
          bgcolor: 'inherit',
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
            p: isMobile ? 1.5 : 2,
            overflow: 'visible !important',
            '&[data-field="actions"]': {
              px: isMobile ? 1 : 0,
            },
          },
          '& .MuiDataGrid-cellEmpty': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'transparent',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'rgba(255, 255, 255, 0.12) !important',
            fontSize: '12px',
            fontWeight: 400,
            p: isMobile ? 1.5 : 2,
            overflow: 'visible !important',
            textTransform: 'uppercase',
            borderBottom: 'none !important',
          },
          '& .MuiDataGrid-row': {
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
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
