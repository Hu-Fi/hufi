import { FC } from 'react';

import { useGetExchangeApiKeys } from '../../hooks/recording-oracle/exchangeApiKeys';

const ApiKeysTable: FC = () => {
  const { data } = useGetExchangeApiKeys();

  return <div>ApiKeysTable</div>;
};

export default ApiKeysTable;
