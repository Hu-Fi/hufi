import { FC } from 'react';

import { Box, Typography } from '@mui/material';
import { BigNumberish, ethers } from 'ethers';

import { CryptoEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import { PaginatedTable } from '../../components/paginated-table';
import { useCampaigns } from '../../hooks';
import { ExchangeName, TokenName } from '../../types';
import dayjs from '../../utils/dayjs';

export const Main: FC = () => {
  const { loading, campaigns } = useCampaigns();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={6}>
      <Typography variant="h4" color="primary">
        Campaigns
      </Typography>
      {loading ? (
        <Loading />
      ) : (
        <PaginatedTable
          columns={[
            { id: 'address', label: 'Address' },
            {
              id: 'exchangeName',
              label: 'Exchange',
              format: (value) => <CryptoEntity name={value as ExchangeName} />,
            },
            {
              id: 'symbol',
              label: 'Symbol',
              format: (value) => <CryptoEntity name={value as TokenName} />,
            },
            {
              id: 'startBlock',
              label: 'Start Date',
              format: (value) =>
                new Date(+(value as string) * 1000).toLocaleString(),
            },
            {
              id: 'duration',
              label: 'Duration',
              format: (value) =>
                dayjs.duration(value as number, 'seconds').humanize(),
            },
            {
              id: 'totalFundedAmount',
              label: 'Fund Amount',
              format: (value) =>
                `${ethers.formatEther(value as BigNumberish)} HMT`,
            },
          ]}
          data={campaigns}
        />
      )}
    </Box>
  );
};
