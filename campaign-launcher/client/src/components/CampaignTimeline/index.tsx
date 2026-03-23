import { type FC } from 'react';

import { Box, Typography } from '@mui/material';

import { useCampaignTimeline } from '@/hooks/useCampaignTimeline';
import { type Campaign } from '@/types';

type Props = {
  campaign: Campaign;
  direction?: 'row' | 'column';
};

const mapLabelToColor = (label: string) => {
  switch (label) {
    case 'Starts on':
      return '#43ba96';
    case 'Ends on':
      return '#b98c08';
    case 'Cancelled on':
      return '#ff6262';
    case 'Ended on':
      return '#d4cfff';
    default:
      return 'transparent';
  }
};

const CampaignTimeline: FC<Props> = ({ campaign, direction = 'row' }) => {
  const timeline = useCampaignTimeline(campaign);
  const isRow = direction === 'row';
  return (
    <Box
      display="flex"
      alignItems={isRow ? 'center' : 'flex-start'}
      flexDirection={direction}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        letterSpacing="0.15px"
        mr={isRow ? 1 : 0}
      >
        {timeline.label}
      </Typography>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Box
          width={6}
          height={6}
          bgcolor={mapLabelToColor(timeline.label)}
          borderRadius="50%"
          border="3px solid"
          borderColor={mapLabelToColor(timeline.label)}
        />
        <Typography
          component="p"
          variant={isRow ? 'caption' : 'subtitle2'}
          color={mapLabelToColor(timeline.label)}
          fontWeight={700}
          lineHeight="150%"
          letterSpacing="0.15px"
        >
          {timeline.value}
        </Typography>
      </Box>
    </Box>
  );
};

export default CampaignTimeline;
