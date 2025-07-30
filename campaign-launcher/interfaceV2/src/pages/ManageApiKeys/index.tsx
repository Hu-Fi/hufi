import { FC, useState, useEffect } from 'react';

import Button from '@mui/material/Button';

import { recordingApi } from '../../api';
import ApiKeysTable from '../../components/ApiKeysTable';
import AddApiKeyModal from '../../components/modals/AddApiKeyModal';
import PageTitle from '../../components/PageTitle';
import PageWrapper from '../../components/PageWrapper';
import { useGetExchangeApiKeys } from '../../hooks/recording-oracle';
import { ApiKeyData } from '../../types';

const ManageApiKeysPage: FC = () => {
  const [addApiKeyModalOpen, setAddApiKeyModalOpen] = useState(false);
  const [apiKeysData, setApiKeysData] = useState<Record<string, ApiKeyData>>({});
  const { data: apiKeys } = useGetExchangeApiKeys();

  useEffect(() => {
    if (apiKeys && apiKeys.length > 0) {
      const fetchApiKeysData = async () => {
        try {
          const promises = apiKeys.map(async (exchangeName) => {
            const response = await recordingApi.get<ApiKeyData>(`/exchange-api-keys/${exchangeName}`);
            return { exchangeName, data: response };
          });

          const results = await Promise.all(promises);
          
          const newApiKeysData: Record<string, ApiKeyData> = {};
          results.forEach(({ exchangeName, data }) => {
            newApiKeysData[exchangeName] = data;
          });

          setApiKeysData(newApiKeysData);
        } catch (error) {
          console.error('Error fetching API keys:', error);
        }
      };

      fetchApiKeysData();
    } else {
      setApiKeysData({});
    }
  }, [apiKeys]);
  
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
