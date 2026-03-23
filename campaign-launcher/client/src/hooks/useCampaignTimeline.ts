import { CampaignStatus, type Campaign } from '@/types';
import dayjs from '@/utils/dayjs';

const DATE_FORMAT = 'Do MMM YYYY';

type CampaignTimelineSource =
  | Pick<Campaign, 'start_date' | 'end_date' | 'status'>
  | null
  | undefined;

type CampaignTimelineDisplay = {
  label: string;
  value: string;
};

export const useCampaignTimeline = (
  campaign: CampaignTimelineSource
): CampaignTimelineDisplay => {
  if (!campaign) {
    return {
      label: '',
      value: '',
    };
  }

  const nowDate = dayjs();
  const startDate = dayjs(campaign.start_date);
  const endDate = dayjs(campaign.end_date);

  if (!nowDate.isBefore(endDate)) {
    if (campaign.status === CampaignStatus.CANCELLED) {
      return {
        label: 'Cancelled on',
        value: endDate.format(DATE_FORMAT),
      };
    }

    return {
      label: 'Ended on',
      value: endDate.format(DATE_FORMAT),
    };
  }

  if (startDate.isAfter(nowDate)) {
    return {
      label: 'Starts on',
      value: startDate.format(DATE_FORMAT),
    };
  }

  return {
    label: 'Ends on',
    value: endDate.format(DATE_FORMAT),
  };
};
