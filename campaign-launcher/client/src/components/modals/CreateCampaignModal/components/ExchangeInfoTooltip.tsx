import { Link, Typography } from "@mui/material";

import { useIsMobile } from "../../../../hooks/useBreakpoints";
import CustomTooltip from "../../../CustomTooltip";
import InfoTooltipInner from "../../../InfoTooltipInner";

const ExchangeInfoTooltip = () => {
  const isMobile = useIsMobile();
  return (
    <CustomTooltip
      arrow
      placement={isMobile ? 'top' : 'right'}
      title={
        <>
          <Typography component="p" variant="tooltip" color="primary.contrast">
            Can&apos;t find the exchange? <br />
            Click the link below to submit a request. <br />
            We&apos;d love to hear from you! <br />
            <Link
              href=""
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

export default ExchangeInfoTooltip
