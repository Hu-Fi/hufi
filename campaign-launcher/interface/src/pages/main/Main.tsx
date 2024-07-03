import { FC, useState } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, SelectChangeEvent, Typography } from '@mui/material';
import { BigNumberish, ethers, isAddress } from 'ethers';
import { useNavigate } from 'react-router-dom';

import { CryptoEntity, CryptoPairEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import { NetworkSelect } from '../../components/network-select';
import { PaginatedTable } from '../../components/paginated-table';
import { useCampaigns } from '../../hooks';
import { ExchangeName, TokenName } from '../../types';
import { shortenAddress } from '../../utils/address';
import dayjs from '../../utils/dayjs';

export const Main: FC = () => {
  const [chainId, setChainId] = useState(ChainId.ALL);
  const { loading, campaigns } = useCampaigns(chainId);
  const navigate = useNavigate();

  const handleNetworkChange = (e: SelectChangeEvent<ChainId>) => {
    setChainId(e.target.value as ChainId);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Typography variant="h4" color="primary">
        Campaigns
      </Typography>
      <Box display="flex" width="100%" justifyContent="flex-end">
        <NetworkSelect
          showAllNetwork
          value={chainId}
          onChange={handleNetworkChange}
        />
      </Box>
      {loading ? (
        <Loading />
      ) : (
        <PaginatedTable
          columns={[
            {
              id: 'address',
              label: 'Address',
              format: (value) => shortenAddress(value as string),
            },
            {
              id: 'exchangeName',
              label: 'Exchange',
              format: (value) => <CryptoEntity name={value as ExchangeName} />,
            },
            {
              id: 'symbol',
              label: 'Symbol',
              format: (value) =>
                Object.values(TokenName).includes(value as TokenName) ||
                isAddress(value) ? (
                  <CryptoEntity name={value as TokenName} />
                ) : (
                  <CryptoPairEntity symbol={value as string} />
                ),
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
            {
              id: 'status',
              label: 'Status',
            },
          ]}
          data={campaigns}
          onClickRow={(row) => {
            navigate(`/campaign-detail/${row.chainId}/${row.address}`);
          }}
        />
      )}
    </Box>
  );
};
