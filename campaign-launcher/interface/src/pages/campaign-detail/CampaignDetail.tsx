import { FC } from 'react';

import { ChainId, NETWORKS } from '@human-protocol/sdk';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { Alert, Box, Button, Grid, Link, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import {
  usePopupState,
  bindDialog,
  bindTrigger,
} from 'material-ui-popup-state/hooks';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { APIKeyDialog, APIKeyFormValues } from './APIKeyDialog';
import { useCampaign } from '../../api/campaign';
import { useExchanges } from '../../api/exchange';
import { CryptoEntity, CryptoPairEntity } from '../../components/crypto-entity';
import { Loading } from '../../components/loading';
import {
  useAuthentication,
  useJoinCampaign,
  useRegisterExchangeAPIKey,
  useUserCampaignStatus,
  useUserExchangeAPIKeyExists,
} from '../../hooks/recording-oracle';
import { ExchangeType } from '../../types';

type CampaignDetailProps = {};

export const CampaignDetail: FC<CampaignDetailProps> = () => {
  const { chainId, address } = useParams<{
    chainId: string;
    address: string;
  }>();

  if (!chainId?.length || !address?.length) {
    return null;
  }

  const { data: campaign, isLoading: loading } = useCampaign(+chainId, address);

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
  const {
    registerExchangeAPIKeyAsync,
    isLoading: isRegisterExchangeAPIKeyLoading,
  } = useRegisterExchangeAPIKey({
    onSuccess: async () => {
      if (campaign) {
        await joinCampaignAsync(campaign.address);
      }
    },
  });

  const { data: userExchangeAPIKeyExists } = useUserExchangeAPIKeyExists(
    account.address,
    campaign?.exchangeName
  );

  const apiKeyDialogPopupState = usePopupState({
    variant: 'popover',
    popupId: 'api-key-dialog',
  });

  const { data: exchanges, isLoading: isLoadingExchanges } = useExchanges();

  const exchange = exchanges?.find(
    (exchange) =>
      exchange.name?.toLowerCase() === campaign?.exchangeName.toLowerCase()
  );

  const handleSubmit = async (values: APIKeyFormValues) => {
    apiKeyDialogPopupState.close();

    if (!campaign?.exchangeName) {
      return;
    }

    await registerExchangeAPIKeyAsync(
      campaign?.exchangeName,
      values.apiKey,
      values.secret
    );
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={4}>
      {loading || isLoadingExchanges ? (
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
                      name={campaign.exchangeName}
                      displayName={exchange?.displayName}
                      logo={exchange?.logo}
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
                    {campaign.symbol.includes('/') ? (
                      <CryptoPairEntity symbol={campaign.symbol as string} />
                    ) : (
                      <CryptoEntity name={campaign.symbol} />
                    )}
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
                isROAuthLoading ||
                !campaign?.address ||
                isJoinCampaignLoading ||
                isRegisterExchangeAPIKeyLoading
              }
              {...(exchange?.type === ExchangeType.CEX &&
              !userExchangeAPIKeyExists
                ? bindTrigger(apiKeyDialogPopupState)
                : {
                    onClick: () =>
                      campaign?.address && joinCampaignAsync(campaign?.address),
                  })}
            >
              Join
            </Button>
          ) : null}
        </>
      )}
      <APIKeyDialog
        {...bindDialog(apiKeyDialogPopupState)}
        maxWidth="sm"
        fullWidth
        onSave={handleSubmit}
        onCancel={() => apiKeyDialogPopupState.close()}
      />
    </Box>
  );
};
