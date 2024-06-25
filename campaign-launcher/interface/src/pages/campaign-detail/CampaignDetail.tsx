import { FC } from 'react';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { Alert, Box, Button, Grid, Link, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { CryptoEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import { useCampaign } from '../../hooks';
import {
  useAuthentication,
  useJoinCampaign,
  useUserCampaignStatus,
} from '../../hooks/recording-oracle';
import { ExchangeName, TokenName } from '../../types';

type CampaignDetailProps = {};

export const CampaignDetail: FC<CampaignDetailProps> = () => {
  const { chainId, address } = useParams<{
    chainId: string;
    address: string;
  }>();

  if (!chainId?.length || !address?.length) {
    return null;
  }

  const { campaign, loading } = useCampaign(+chainId, address);

  const account = useAccount();
  const { isLoading: isROAuthLoading } = useAuthentication();
  const {
    isLoading: isROCampaignStatusLoading,
    fetchUserCampaignStatus,
    isRegistered,
  } = useUserCampaignStatus(address);
  const { joinCampaignAsync, isLoading: isJoinCampaignLoading } =
    useJoinCampaign({
      onSuccess: () => {
        fetchUserCampaignStatus();
      },
    });

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={4}>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Typography color="primary" variant="h5" fontWeight={600}>
            Campaign Details
          </Typography>
          <Grid container>
            <Grid item md={6} xs={12}>
              <Box display="grid" gridTemplateColumns="120px 1fr" gap={2}>
                {campaign?.address && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Address
                    </Typography>
                    <Link
                      href={`${NETWORKS[+chainId as ChainId]?.scanUrl}/address/${campaign.address}`}
                      target="_blank"
                      rel="noreferrer"
                      underline="none"
                    >
                      <Typography variant="body2" color="primary">
                        {campaign.address}
                      </Typography>
                    </Link>
                  </>
                )}
                {campaign?.exchangeName && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Exchange
                    </Typography>
                    <CryptoEntity
                      name={campaign.exchangeName as ExchangeName}
                    />
                  </>
                )}
                {campaign?.symbol && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Symbol
                    </Typography>
                    <CryptoEntity name={campaign.symbol as TokenName} />
                  </>
                )}
                {campaign?.startBlock && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Start Date
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {dayjs(new Date(campaign.startBlock * 1000)).toString()}
                    </Typography>
                    {campaign?.duration && (
                      <>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="primary"
                        >
                          End Date
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {dayjs(
                            new Date(
                              campaign.startBlock * 1000 +
                                campaign.duration * 1000
                            )
                          ).toString()}
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Box>
            </Grid>
            <Grid item md={6} xs={12}>
              <Box display="grid" gridTemplateColumns="200px 1fr" gap={2}>
                {campaign?.totalFundedAmount && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Total Funded Amount
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {ethers.formatEther(campaign.totalFundedAmount)} HMT
                    </Typography>
                  </>
                )}
                {campaign?.amountPaid && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Amount Paid
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {ethers.formatEther(campaign.amountPaid)} HMT
                    </Typography>
                  </>
                )}
                {campaign?.status && (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="primary"
                    >
                      Status
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {campaign.status}
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
          {isROCampaignStatusLoading ? (
            <Loading />
          ) : isRegistered ? (
            <Alert severity="info" icon={<InfoIcon color="primary" />}>
              <Typography variant="body2" color="primary">
                You are registered to this campaign.
              </Typography>
            </Alert>
          ) : account.isConnected ? (
            <Button
              variant="contained"
              color="primary"
              disabled={
                isROAuthLoading || !campaign?.address || isJoinCampaignLoading
              }
              onClick={() =>
                campaign?.address && joinCampaignAsync(campaign.address)
              }
            >
              Join
            </Button>
          ) : null}
        </>
      )}
    </Box>
  );
};
