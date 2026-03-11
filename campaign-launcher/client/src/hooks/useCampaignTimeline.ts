import { useEffect, useState } from 'react';

import { CampaignStatus, type Campaign } from '@/types';
import dayjs from '@/utils/dayjs';

const DATE_FORMAT = 'Do MMM YYYY';
const COUNTDOWN_THRESHOLD_HOURS = 24;

type CampaignTimelineSource =
  | Pick<Campaign, 'start_date' | 'end_date' | 'status'>
  | null
  | undefined;

type CampaignTimelineDisplay = {
  label: string;
  value: string;
};

const getCountdownValue = (targetDate: dayjs.Dayjs, nowDate: dayjs.Dayjs) => {
  const diffMs = targetDate.diff(nowDate);

  if (diffMs <= 0) {
    return '0s';
  }

  const duration = dayjs.duration(diffMs);
  const totalHours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  if (totalHours > 0) {
    return `${totalHours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const getCampaignTimelineDisplay = (
  campaign: CampaignTimelineSource,
  nowDate: dayjs.Dayjs
): CampaignTimelineDisplay => {
  if (!campaign) {
    return {
      label: '',
      value: '',
    };
  }

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
    const startDiffInHours = startDate.diff(nowDate, 'hour', true);

    if (startDiffInHours <= COUNTDOWN_THRESHOLD_HOURS) {
      return {
        label: 'Starts in',
        value: getCountdownValue(startDate, nowDate),
      };
    }

    return {
      label: 'Starts on',
      value: startDate.format(DATE_FORMAT),
    };
  }

  const endDiffInHours = endDate.diff(nowDate, 'hour', true);

  if (endDiffInHours <= COUNTDOWN_THRESHOLD_HOURS) {
    return {
      label: 'Ends in',
      value: getCountdownValue(endDate, nowDate),
    };
  }

  return {
    label: 'Ends on',
    value: endDate.format(DATE_FORMAT),
  };
};

const shouldRunCountdownInterval = (
  start_date: string,
  end_date: string,
  nowDate: dayjs.Dayjs
) => {
  if (!start_date || !end_date) {
    return false;
  }

  const startDate = dayjs(start_date);
  const endDate = dayjs(end_date);

  if (!nowDate.isBefore(endDate)) {
    return false;
  }

  if (startDate.isAfter(nowDate)) {
    return startDate.diff(nowDate, 'hour', true) <= COUNTDOWN_THRESHOLD_HOURS;
  }

  return endDate.diff(nowDate, 'hour', true) <= COUNTDOWN_THRESHOLD_HOURS;
};

export const useCampaignTimeline = (
  campaign: CampaignTimelineSource
): CampaignTimelineDisplay => {
  const [nowDate, setNowDate] = useState(() => dayjs());
  const { start_date, end_date } = campaign || {};

  useEffect(() => {
    if (!start_date || !end_date) {
      return;
    }

    const nowDate = dayjs();
    setNowDate(nowDate);

    if (!shouldRunCountdownInterval(start_date, end_date, nowDate)) {
      return;
    }

    const intervalId = setInterval(() => {
      const updatedNowDate = dayjs();

      if (!shouldRunCountdownInterval(start_date, end_date, updatedNowDate)) {
        clearInterval(intervalId);
      }

      setNowDate(updatedNowDate);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [start_date, end_date]);

  return getCampaignTimelineDisplay(campaign, nowDate);
};
