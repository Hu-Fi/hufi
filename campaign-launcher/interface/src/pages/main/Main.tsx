import { FC, useState } from 'react';

import { ChainId } from '@human-protocol/sdk';
import { Box, SelectChangeEvent, Typography } from '@mui/material';
import { BigNumberish, ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

import { useCampaigns } from '../../api/campaign';
import { useExchanges } from '../../api/exchange';
import { CryptoEntity, CryptoPairEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import { NetworkSelect } from '../../components/network-select';
import { PaginatedTable } from '../../components/paginated-table';
import { getSupportedChainIds } from '../../config/network';
import { shortenAddress } from '../../utils/address';
import dayjs from '../../utils/dayjs';

export const Main: FC = () => {
  const [chainId, setChainId] = useState(getSupportedChainIds()?.[0]);
  const { data: campaigns, isLoading: loading } = useCampaigns(chainId);
  const { data: exchanges, isLoading: isLoadingExchanges } = useExchanges();
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
      {loading || isLoadingExchanges ? (
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
              format: (value) => {
                const exchange = exchanges?.find(
                  (exchange) => exchange.name === value
                );
                return (
                  <CryptoEntity
                    name={exchange?.name}
                    displayName={exchange?.displayName}
                    logo={exchange?.logo}
                  />
                );
              },
            },
            {
              id: 'symbol',
              label: 'Symbol',
              format: (value) =>
                (value as string).includes('/') ? (
                  <CryptoPairEntity symbol={value as string} />
                ) : (
                  <CryptoEntity name={value as string} />
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
          data={campaigns || []}
          onClickRow={(row) => {
            navigate(`/campaign-detail/${row.chainId}/${row.address}`);
          }}
        />
      )}
    </Box>
  );
};
