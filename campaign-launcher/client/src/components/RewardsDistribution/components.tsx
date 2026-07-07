import { type FC } from 'react';

import { Box, SvgIcon, type SvgIconProps, Typography } from '@mui/material';

import FormattedNumber from '@/components/FormattedNumber';
import { getCompactNumberParts, getOrdinalSuffix } from '@/utils';

type RewardPlaceProps = {
  place: number;
};

export const RewardPlace: FC<RewardPlaceProps> = ({ place }) => {
  return (
    <Typography
      variant="body2"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: 80 }}
    >
      <Box
        component="span"
        sx={{
          p: 0.25,
          borderRadius: '50%',
          bgcolor: 'neutral.200',
        }}
      />
      {`${place}${getOrdinalSuffix(place)} place`}
    </Typography>
  );
};

type RewardAmountProps = {
  percentage: number;
  fundToken: string;
  fundAmount: number;
};

export const RewardAmount: FC<RewardAmountProps> = ({
  percentage,
  fundToken,
  fundAmount,
}) => {
  const { value, suffix, decimals } = getCompactNumberParts(
    (percentage * fundAmount) / 100
  );
  return (
    <Typography
      variant="body2"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.paper',
        py: 0.5,
        px: { xs: 1, md: 1.5 },
        minWidth: { xs: '110px', md: '120px' },
        borderRadius: '99px',
        textTransform: 'uppercase',
      }}
    >
      <FormattedNumber
        value={value}
        decimals={decimals}
        suffix={`${suffix} ${fundToken}`}
      />
    </Typography>
  );
};

export const FirstPlaceIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 11 18" fill="none">
      <path
        opacity="0.6"
        d="M4.35778 16.3625C4.35778 16.9179 4.80796 17.368 5.36328 17.368C5.9186 17.368 6.36878 16.9179 6.36878 16.3625H5.36328H4.35778ZM0.00061655 5.36255C0.00061655 8.32427 2.40156 10.7252 5.36328 10.7252C8.325 10.7252 10.7259 8.32427 10.7259 5.36255C10.7259 2.40083 8.325 -0.000115871 5.36328 -0.000115871C2.40156 -0.000115871 0.00061655 2.40083 0.00061655 5.36255ZM5.36328 16.3625H6.36878V5.36255H5.36328H4.35778V16.3625H5.36328Z"
        fill="#FFC628"
      />
    </SvgIcon>
  );
};

export const SecondPlaceIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 23 16" fill="none">
      <g opacity="0.6">
        <path
          d="M7.95529 13.8197C7.63109 14.1439 7.63109 14.6695 7.95529 14.9937C8.27948 15.3179 8.80511 15.3179 9.12931 14.9937L8.5423 14.4067L7.95529 13.8197ZM15.3908 1.29677C13.6617 3.02582 13.6617 5.82916 15.3908 7.55822C17.1198 9.28727 19.9232 9.28727 21.6522 7.55822C23.3813 5.82916 23.3813 3.02582 21.6522 1.29677C19.9232 -0.432286 17.1198 -0.432286 15.3908 1.29677ZM8.5423 14.4067L9.12931 14.9937L19.1085 5.0145L18.5215 4.42749L17.9345 3.84048L7.95529 13.8197L8.5423 14.4067Z"
          fill="#B7ADD9"
        />
        <path
          d="M13.8199 14.9937C14.1441 15.3179 14.6697 15.3179 14.9939 14.9937C15.3181 14.6695 15.3181 14.1439 14.9939 13.8197L14.4069 14.4067L13.8199 14.9937ZM1.29701 7.55822C3.02606 9.28727 5.82941 9.28727 7.55846 7.55822C9.28751 5.82916 9.28751 3.02582 7.55846 1.29677C5.82941 -0.432286 3.02606 -0.432286 1.29701 1.29677C-0.432042 3.02582 -0.432042 5.82916 1.29701 7.55822ZM14.4069 14.4067L14.9939 13.8197L5.01475 3.84048L4.42773 4.42749L3.84072 5.0145L13.8199 14.9937L14.4069 14.4067Z"
          fill="#B7ADD9"
        />
      </g>
    </SvgIcon>
  );
};

export const ThirdPlaceIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 21 19" fill="none">
      <g opacity="0.6">
        <path
          d="M10.5429 9.88318L9.94718 9.45937L9.09956 10.6508L9.69526 11.0746L10.1191 10.4789L10.5429 9.88318ZM18.565 11.7026C16.8104 10.4542 14.376 10.8647 13.1276 12.6193C11.8793 14.374 12.2897 16.8084 14.0444 18.0567C15.799 19.3051 18.2334 18.8946 19.4818 17.14C20.7301 15.3853 20.3197 12.9509 18.565 11.7026ZM10.1191 10.4789L9.69526 11.0746L15.8809 15.4753L16.3047 14.8796L16.7285 14.2839L10.5429 9.88318L10.1191 10.4789Z"
          fill="#DF8B39"
        />
        <path
          d="M9.37048 10.4789L9.37048 11.21L10.8326 11.21L10.8326 10.4789L10.1016 10.4789L9.37048 10.4789ZM6.20247 3.89917C6.20247 6.05258 7.94815 7.79826 10.1016 7.79826C12.255 7.79826 14.0007 6.05258 14.0007 3.89917C14.0007 1.74576 12.255 8.02028e-05 10.1016 8.01086e-05C7.94815 8.00145e-05 6.20247 1.74576 6.20247 3.89917ZM10.1016 10.4789L10.8326 10.4789L10.8326 3.89917L10.1016 3.89917L9.37048 3.89917L9.37048 10.4789L10.1016 10.4789Z"
          fill="#DF8B39"
        />
        <path
          d="M10.5406 11.0757L11.1374 10.6534L10.2929 9.45982L9.69607 9.88208L10.1183 10.4789L10.5406 11.0757ZM6.15048 18.0626C7.90837 16.8188 8.32516 14.3855 7.0814 12.6276C5.83763 10.8697 3.4043 10.4529 1.6464 11.6967C-0.1115 12.9404 -0.528287 15.3738 0.715479 17.1317C1.95925 18.8896 4.39258 19.3064 6.15048 18.0626ZM10.1183 10.4789L9.69607 9.88208L3.47618 14.2828L3.89844 14.8796L4.32069 15.4764L10.5406 11.0757L10.1183 10.4789Z"
          fill="#DF8B39"
        />
      </g>
    </SvgIcon>
  );
};
