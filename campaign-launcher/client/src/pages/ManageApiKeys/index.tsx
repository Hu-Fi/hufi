import { type FC, type PropsWithChildren, useState } from 'react';

import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import AddApiKeyDialog from '@/components/AddApiKeyDialog';
import ApiKeysTable from '@/components/ApiKeysTable';
import { useReserveLayoutBottomOffset } from '@/components/Layout';
import PageWrapper from '@/components/PageWrapper';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants';
import { useGetExchangesWithApiKeys } from '@/hooks/recording-oracle';
import { useIsMobile } from '@/hooks/useBreakpoints';

const BottomButtonWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height={MOBILE_BOTTOM_NAV_HEIGHT}
      bgcolor="background.default"
      borderTop="2px solid #251d47"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      py={2}
      px={3}
      zIndex={(theme) => theme.zIndex.appBar}
    >
      {children}
    </Box>
  );
};

const ManageApiKeysPage: FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: apiKeysData, isLoading } = useGetExchangesWithApiKeys();
  const isMobile = useIsMobile();

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
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography component="h2" variant="h6" color="white" fontWeight={600}>
          Manage API Keys
        </Typography>
        {!isMobile && addApiKeyCta}
      </Box>
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
