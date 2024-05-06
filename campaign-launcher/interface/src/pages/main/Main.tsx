import { FC } from 'react';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Box, Typography } from '@mui/material';
import { BigNumberish, ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { useChainId } from 'wagmi';

import { CryptoEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import { PaginatedTable } from '../../components/paginated-table';
import { useCampaigns } from '../../hooks';
import { ExchangeName, TokenName } from '../../types';
import { shortenAddress } from '../../utils/address';
import dayjs from '../../utils/dayjs';

export const Main: FC = () => {
  const { loading, campaigns } = useCampaigns();
  const chainId = useChainId();
  const network = NETWORKS[chainId as ChainId];

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
            {
              id: 'address',
              label: 'Address',
              format: (value) => (
                <Link
                  to={`${network?.scanUrl}/address/${value}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Typography>{shortenAddress(value as string)}</Typography>
                </Link>
              ),
            },
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
                dayjs(new Date(+(value as string) * 1000)).toString(),
            },
            {
              id: 'duration',
              label: 'Duration',
              format: (value) => (
                <Typography textTransform="capitalize">
                  {dayjs.duration(value as number, 'seconds').humanize()}
                </Typography>
              ),
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
