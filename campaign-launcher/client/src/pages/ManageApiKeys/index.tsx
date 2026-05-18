import { type FC, type PropsWithChildren, useState } from 'react';

import { Link, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useSearchParams } from 'react-router';

import AddApiKeyDialog from '@/components/AddApiKeyDialog';
import ApiKeysTable from '@/components/ApiKeysTable';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import PageWrapper from '@/components/PageWrapper';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants';
import { useGetExchangesWithApiKeys } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useAuthedUserData } from '@/providers/AuthedUserData';
import { useExchangesContext } from '@/providers/ExchangesProvider';

const API_KEYS_DOC_URL =
  'https://docs.hu.finance/campaign-participation/api-keys/#how-to-create-api-keys';

const DocsReference: FC<{ exchangeName: string }> = ({ exchangeName }) => {
  return (
    <Box sx={{ mb: { xs: 2, md: 3 } }}>
      <Typography
        component="span"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '100%',
          letterSpacing: '0',
        }}
      >
        For you to join a running campaign you must connect your API key.
      </Typography>{' '}
      <Link
        href={API_KEYS_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'inline',
          color: 'error.main',
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none',
          lineHeight: '100%',
          letterSpacing: '0px',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        Learn how to add an API key for {exchangeName}
      </Link>
    </Box>
  );
};

const BottomButtonWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: MOBILE_BOTTOM_NAV_HEIGHT,
        bgcolor: 'background.default',
        borderTop: '2px solid #251d47',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        py: 2,
        px: 3,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      {children}
    </Box>
  );
};

const ManageApiKeysPage: FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const { exchangesMap } = useExchangesContext();
  const { enrolledExchanges, isEnrolledExchangesLoading } = useAuthedUserData();

  const exchangeParam = searchParams.get('exchange') || '';
  const exchangeName = exchangeParam
    ? exchangesMap.get(exchangeParam)?.display_name || ''
    : undefined;

  const { data: apiKeysData, isLoading } = useGetExchangesWithApiKeys();
  const isMobile = useIsMobile();

  const showDocsReference =
    exchangeName &&
    !isEnrolledExchangesLoading &&
    !enrolledExchanges?.includes(exchangeParam);

  useReserveLayoutBottomOffset(isMobile);

  const addApiKeyCta = (
    <Button
      size="large"
      variant="contained"
      color="error"
      fullWidth={isMobile}
      sx={{ minWidth: '135px' }}
      onClick={() => setIsDialogOpen(true)}
    >
      + API Key
    </Button>
  );

  return (
    <PageWrapper>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: showDocsReference ? 2 : 4, md: 4 },
        }}
      >
        <Typography
          component="h2"
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 600,
          }}
        >
          Manage API Keys
        </Typography>
        {!isMobile && addApiKeyCta}
      </Box>
      {showDocsReference && <DocsReference exchangeName={exchangeName} />}
      <ApiKeysTable data={apiKeysData} isLoading={isLoading} />
      <AddApiKeyDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      {isMobile && <BottomButtonWrapper>{addApiKeyCta}</BottomButtonWrapper>}
    </PageWrapper>
  );
};

export default ManageApiKeysPage;
