import { FC, useState } from 'react';

import { Button, Paper } from '@mui/material';

import ApiKeysTable from '../../components/ApiKeysTable';
import AddApiKeyModal from '../../components/modals/AddApiKeyModal';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';

const ManageApiKeysPage: FC = () => {
  const [addApiKeyModalOpen, setAddApiKeyModalOpen] = useState(false);
  return (
    <PageWrapper>
      <PageTitle title="Manage API Keys">
        <Button size="large" variant="contained" sx={{ ml: 'auto' }} onClick={() => setAddApiKeyModalOpen(true)}>
          Add new key
        </Button>
      </PageTitle>
      <Paper
        elevation={1}
        sx={{
          bgcolor: 'background.default',
          minHeight: '560px',
          width: '100%',
          p: 4,
          borderRadius: '16px',
        }}
      >
        <ApiKeysTable />
      </Paper>
      <AddApiKeyModal
        open={addApiKeyModalOpen}
        onClose={() => setAddApiKeyModalOpen(false)}
        handleSubmitKeys={() => {}}
      />
    </PageWrapper>
  );
};

export default ManageApiKeysPage;
