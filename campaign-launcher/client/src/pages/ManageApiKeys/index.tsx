import { type FC, useState } from 'react';

import Button from '@mui/material/Button';

import ApiKeysTable from '@/components/ApiKeysTable';
import AddApiKeyModal from '@/components/modals/AddApiKeyModal';
import PageTitle from '@/components/PageTitle';
import PageWrapper from '@/components/PageWrapper';
import { useGetExchangesWithApiKeys } from '@/hooks/recording-oracle';

const ManageApiKeysPage: FC = () => {
  const [addApiKeyModalOpen, setAddApiKeyModalOpen] = useState(false);
  const { data: apiKeysData } = useGetExchangesWithApiKeys();

  return (
    <PageWrapper>
      <PageTitle title="Manage API Keys">
        <Button
          size="large"
          variant="contained"
          sx={{ ml: 'auto' }}
          onClick={() => setAddApiKeyModalOpen(true)}
        >
          Add new key
        </Button>
      </PageTitle>
      <ApiKeysTable data={apiKeysData} />
      <AddApiKeyModal
        open={addApiKeyModalOpen}
        onClose={() => setAddApiKeyModalOpen(false)}
      />
    </PageWrapper>
  );
};

export default ManageApiKeysPage;
