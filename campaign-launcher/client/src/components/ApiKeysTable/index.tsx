import { type FC, useMemo, useState } from 'react';

import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, IconButton, List, ListItem, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import CustomTooltip from '@/components/CustomTooltip';
import DeleteApiKeyDialog from '@/components/DeleteApiKeyDialog';
import EditApiKeyDialog from '@/components/EditApiKeyDialog';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { useRevalidateExchangeApiKey } from '@/hooks/recording-oracle/exchangeApiKeys';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { DeleteIcon, EditIcon } from '@/icons';
import type { ExchangeApiKeyData } from '@/types';
import { formatAddress } from '@/utils';

type ApiKeysTableProps = {
  data: ExchangeApiKeyData[] | undefined;
  isLoading: boolean;
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

const ApiKeysTable: FC<ApiKeysTableProps> = ({ data, isLoading }) => {
  const [editingItem, setEditingItem] = useState('');
  const [deletingItem, setDeletingItem] = useState('');

  const isMobile = useIsMobile();
  const { mutate: revalidateExchangeApiKey, isPending: isRevalidating } =
    useRevalidateExchangeApiKey();

  const handleClickOnRefresh = (exchangeName: string) => {
    if (isRevalidating) return;
    revalidateExchangeApiKey(exchangeName);
  };

  const handleClickOnEdit = (exchangeName: string) => {
    setEditingItem(exchangeName);
  };

  const handleClickOnDelete = (exchangeName: string) => {
    setDeletingItem(exchangeName);
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
              variant="body2"
              textTransform="capitalize"
              fontWeight={500}
              lineHeight="100%"
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
            <Typography variant="body2" fontWeight={500} lineHeight="100%">
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
      width: isMobile ? 110 : 126,
      renderCell: (params) => {
        const { exchangeName, isValid } = params.row;
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap={1.5}
          >
            {!isValid && (
              <IconButton
                sx={{ p: 0 }}
                disableRipple
                disabled={isRevalidating}
                onClick={() => handleClickOnRefresh(exchangeName)}
              >
                <RefreshIcon
                  sx={{
                    color: isRevalidating ? 'text.disabled' : 'text.primary',
                  }}
                />
              </IconButton>
            )}
            <IconButton
              sx={{ p: 0 }}
              disableRipple
              onClick={() => handleClickOnEdit(exchangeName)}
            >
              <EditIcon sx={{ color: 'text.primary' }} />
            </IconButton>
            <IconButton
              sx={{ p: 0 }}
              disableRipple
              onClick={() => handleClickOnDelete(exchangeName)}
            >
              <DeleteIcon sx={{ color: 'text.primary' }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box
      width={{ xs: 'calc(100% + 32px)', md: '100%' }}
      overflow="hidden"
      mx={{ xs: -2, md: 0 }}
    >
      <DataGrid
        columns={columns}
        rows={rows || []}
        columnHeaderHeight={40}
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
        loading={isLoading}
        slots={{
          loadingOverlay: undefined,
          noRowsOverlay: !isLoading
            ? () => (
                <Box
                  display="flex"
                  width="100%"
                  height="100%"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="body2" fontWeight={500}>
                    No key is set at the moment
                  </Typography>
                </Box>
              )
            : undefined,
        }}
        sx={{
          border: 'none',
          bgcolor: 'inherit',
          borderRadius: '0px',
          '& .MuiDataGrid-main': {
            p: isMobile ? 0 : 0,
            width: '100%',
            height: '400px',
            background: 'background.default',
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
            borderTop: 'none',
            py: 1.5,
            px: 2,
            overflow: 'visible !important',
            '&[data-field="actions"]': {
              px: isMobile ? 1 : 2,
              justifyContent: 'flex-end',
            },
            '&[data-field="apiKey"]': {
              px: 0,
            },
          },
          '& .MuiDataGrid-cellEmpty': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'transparent',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#251d47',
            fontSize: '14px',
            lineHeight: '14px',
            fontWeight: 500,
            py: 1.5,
            px: 2,
            overflow: 'visible !important',
            borderBottom: 'none !important',
            '&[data-field="apiKey"]': {
              px: 0,
            },
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
      <EditApiKeyDialog
        open={!!editingItem}
        onClose={() => setEditingItem('')}
        exchangeName={editingItem}
      />
      <DeleteApiKeyDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem('')}
        exchangeName={deletingItem}
      />
    </Box>
  );
};

export default ApiKeysTable;
