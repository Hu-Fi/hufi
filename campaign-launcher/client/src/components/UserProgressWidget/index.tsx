import type { FC } from 'react';

import { Box, Skeleton, Stack, Typography } from '@mui/material';

import { useGetUserProgress } from '@/hooks/recording-oracle';
import { CampaignType, type CampaignDetails, type UserProgress } from '@/types';
import { getDailyTargetTokenSymbol } from '@/utils';
import dayjs from '@/utils/dayjs';

type Props = {
  campaign: CampaignDetails;
};

const formatTime = (dateString: string): string => {
  const date = dayjs(dateString);
  return date.format('HH:mm:ss');
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year} ${formatTime(dateString)}`;
};

const getLabels = (campaignType: CampaignType) => {
  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      return {
        total: 'Total Volume',
        my: 'My Volume',
      };
    case CampaignType.HOLDING:
      return {
        total: 'Total Score',
        my: 'My Balance',
      };
    case CampaignType.THRESHOLD:
      return {
        total: 'Total Score',
        my: 'My Balance',
      };
    default:
      return campaignType as never;
  }
};

const getMyMeta = (
  campaignType: CampaignType,
  data: UserProgress | undefined
) => {
  if (!data) return null;

  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      if ('total_volume' in data.my_meta) {
        return data.my_meta.total_volume;
      }
      return 0;
    case CampaignType.HOLDING:
      if ('token_balance' in data.my_meta) {
        return data.my_meta.token_balance;
      }
      return 0;
    case CampaignType.THRESHOLD:
      if ('token_balance' in data.my_meta) {
        return data.my_meta.token_balance;
      }
      return 0;
    default:
      return 0;
  }
};

const getTotalMeta = (
  campaignType: CampaignType,
  data: UserProgress | undefined
) => {
  if (!data) return null;

  switch (campaignType) {
    case CampaignType.MARKET_MAKING:
      if ('total_volume' in data.total_meta) {
        return data.total_meta.total_volume;
      }
      return 0;
    case CampaignType.HOLDING:
      if ('total_balance' in data.total_meta) {
        return data.total_meta.total_balance;
      }
      return 0;
    case CampaignType.THRESHOLD:
      if ('total_score' in data.total_meta) {
        return data.total_meta.total_score;
      }
      return 0;
    default:
      return 0;
  }
};

const UserProgressWidget: FC<Props> = ({ campaign }) => {
  const { data, isLoading } = useGetUserProgress(campaign.address);
  const targetTokenSymbol = getDailyTargetTokenSymbol(
    campaign.type,
    campaign.symbol
  );

  if (!isLoading && !data) {
    return <Typography variant="subtitle2">No data from backend</Typography>;
  }

  return (
    <Stack justifyContent="space-between" gap={{ xs: 2, md: 0 }}>
      <Typography variant="subtitle2">My Campaign Progress</Typography>
      <Stack gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" width={40}>
            From:
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={180} height={22} />
          ) : (
            <Typography variant="subtitle2">
              {formatDate(data?.from)}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" width={40}>
            To:
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={180} height={22} />
          ) : (
            <Typography variant="subtitle2">{formatDate(data?.to)}</Typography>
          )}
        </Box>
      </Stack>
      <Stack gap={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" width={100}>
            {getLabels(campaign.type).total}
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={180} height={32} />
          ) : (
            <Typography variant="h6" color="primary.violet" fontWeight={700}>
              {getTotalMeta(campaign.type, data)}{' '}
              {campaign.type !== CampaignType.THRESHOLD
                ? targetTokenSymbol
                : null}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" width={100}>
            My Score
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={180} height={32} />
          ) : (
            <Typography variant="h6" color="primary.violet" fontWeight={700}>
              {data?.my_score}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle2" width={100}>
            {getLabels(campaign.type).my}
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={180} height={32} />
          ) : (
            <Typography variant="h6" color="primary.violet" fontWeight={700}>
              {getMyMeta(campaign.type, data)} {targetTokenSymbol}
            </Typography>
          )}
        </Box>
      </Stack>
    </Stack>
  );
};

export default UserProgressWidget;
