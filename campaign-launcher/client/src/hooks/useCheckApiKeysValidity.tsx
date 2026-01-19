import { useCallback } from 'react';

import { Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { ROUTES } from '@/constants';

import { useGetExchangesWithApiKeys } from './recording-oracle';
import { useNotification } from './useNotification';

const useCheckApiKeysValidity = () => {
  const { refetch } = useGetExchangesWithApiKeys({ enabled: false });
  const { showError } = useNotification();

  const checkApiKeysValidity = useCallback(async () => {
    const { data: apiKeys } = await refetch();

    if (!apiKeys) {
      return;
    }

    const isInvalidKeyExist = apiKeys.some((key) => !key.is_valid);
    if (isInvalidKeyExist) {
      const message = (
        <Box>
          Some of your API keys are invalid or missing permissions.
          <br />
          <Link
            component={RouterLink}
            to={ROUTES.MANAGE_API_KEYS}
            color="inherit"
            sx={{ textDecoration: 'underline', fontWeight: 'bold' }}
          >
            Update them here
          </Link>
          .
        </Box>
      );
      showError(message, {
        position: { vertical: 'bottom', horizontal: 'right' },
      });
    }
  }, [refetch, showError]);

  return { checkApiKeysValidity };
};

export default useCheckApiKeysValidity;
