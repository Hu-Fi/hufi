import { Link, Typography } from '@mui/material';

import CustomTooltip from '@/components/CustomTooltip';
import InfoTooltipInner from '@/components/InfoTooltipInner';
import { useIsMobile } from '@/hooks/useBreakpoints';

const link = import.meta.env.VITE_REQUEST_EXCHANGE_FORM_URL;

const ExchangeInfoTooltip = () => {
  const isMobile = useIsMobile();
  return (
    <CustomTooltip
      arrow
      placement={isMobile ? 'left' : 'right'}
      title={
        <>
          <Typography component="p" variant="tooltip" color="primary.contrast">
            Can&apos;t find the exchange? <br />
            Click the link below to submit a request. <br />
            We&apos;d love to hear from you! <br />
            <Link
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              color="primary.contrast"
            >
              Submit request
            </Link>
          </Typography>
        </>
      }
    >
      <InfoTooltipInner />
    </CustomTooltip>
  );
};

export default ExchangeInfoTooltip;
