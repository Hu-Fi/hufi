import type { FC } from 'react';

import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

export const DiscordIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 32 32">
      <path d="M24.1774 7.675C22.5591 6.8925 20.8287 6.32381 19.0197 6C18.7975 6.41512 18.538 6.97346 18.359 7.41762C16.4359 7.11874 14.5306 7.11874 12.6429 7.41762C12.464 6.97346 12.1985 6.41512 11.9743 6C10.1633 6.32381 8.431 6.89459 6.8127 7.67914C3.54859 12.7767 2.66374 17.7476 3.10616 22.648C5.2711 24.3188 7.36918 25.3338 9.43185 25.9979C9.94113 25.2736 10.3953 24.5035 10.7866 23.692C10.0414 23.3994 9.32763 23.0382 8.6532 22.6189C8.83213 22.482 9.00714 22.3387 9.17623 22.1914C13.2898 24.1798 17.7593 24.1798 21.8237 22.1914C21.9948 22.3387 22.1697 22.482 22.3467 22.6189C21.6703 23.0403 20.9546 23.4014 20.2093 23.6941C20.6006 24.5035 21.0529 25.2757 21.5641 26C23.6288 25.3358 25.7288 24.3209 27.8937 22.648C28.4129 16.9672 27.0069 12.0419 24.1774 7.675ZM11.3471 19.6343C10.1122 19.6343 9.09953 18.4429 9.09953 16.9921C9.09953 15.5413 10.0906 14.3479 11.3471 14.3479C12.6036 14.3479 13.6162 15.5392 13.5946 16.9921C13.5965 18.4429 12.6036 19.6343 11.3471 19.6343ZM19.6529 19.6343C18.418 19.6343 17.4053 18.4429 17.4053 16.9921C17.4053 15.5413 18.3963 14.3479 19.6529 14.3479C20.9093 14.3479 21.922 15.5392 21.9004 16.9921C21.9004 18.4429 20.9093 19.6343 19.6529 19.6343Z" />
    </SvgIcon>
  );
};

export const JobsIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 66 66">
      <path
        d="M66 33C66 51.2254 51.2254 66 33 66C14.7746 66 0 51.2254 0 33C0 14.7746 14.7746 0 33 0C51.2254 0 66 14.7746 66 33Z"
        fill="url(#paint0_radial_271_3)"
        fillOpacity="0.1"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33 61.9304C48.9778 61.9304 61.9304 48.9778 61.9304 33C61.9304 17.0222 48.9778 4.06959 33 4.06959C17.0222 4.06959 4.06959 17.0222 4.06959 33C4.06959 48.9778 17.0222 61.9304 33 61.9304ZM33 66C51.2254 66 66 51.2254 66 33C66 14.7746 51.2254 0 33 0C14.7746 0 0 14.7746 0 33C0 51.2254 14.7746 66 33 66Z"
        fill="url(#paint1_linear_271_3)"
        fillOpacity="0.05"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.0488 28.8091V41.6684L35.1138 48.8779L48.1788 41.6684V28.3343L35.5695 21.5743L22.0488 28.8091Z"
        fill="url(#paint2_linear_271_3)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32.1663 16.3135L44.9438 23.1636V37.0155L31.7939 44.2718L18.644 37.0155V23.5492L32.1663 16.3135Z"
        stroke="#CDC7FF"
        strokeWidth="1.24294"
        fill="transparent"
      />
      <path
        d="M18.9111 23.7869L31.8075 30.5422L45.1425 23.3922"
        stroke="#CDC7FF"
        strokeWidth="1.24294"
        fill="transparent"
      />
      <path
        d="M31.8123 44.2718V30.4542"
        stroke="#CDC7FF"
        strokeWidth="1.24294"
        fill="transparent"
      />
      <defs>
        <radialGradient
          id="paint0_radial_271_3"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(33 10.6895) rotate(90) scale(55.3105)"
        >
          <stop stopColor="#F0F0FF" />
          <stop stopColor="#F1F1FD" />
          <stop offset="0.703125" stopColor="white" />
        </radialGradient>
        <linearGradient
          id="paint1_linear_271_3"
          x1="72.5261"
          y1="66"
          x2="77.495"
          y2="44.1101"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F7F8FD" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_271_3"
          x1="25.8308"
          y1="26.2446"
          x2="43.2617"
          y2="48.1393"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#CDC7FF" stopOpacity="0.2" />
          <stop offset="1" stopColor="#CDC7FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </SvgIcon>
  );
};

export const AvatarIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10.5" fill="#0DD3FF" />
      <circle cx="11" cy="11" r="10.5" fill="#858EC6" />
      <path
        d="M21.5 11C21.5 16.799 16.799 21.5 11 21.5C5.20101 21.5 0.5 16.799 0.5 11C0.5 5.201 5.20101 11 11 11C16.799 11 21.5 5.201 21.5 11Z"
        fill="#0DD3FF"
      />
      <path
        d="M21.5 11C21.5 16.799 16.799 21.5 11 21.5C5.20101 21.5 0.5 16.799 0.5 11C0.5 5.201 5.20101 11 11 11C16.799 11 21.5 5.201 21.5 11Z"
        fill="#320A8D"
      />
    </SvgIcon>
  );
};

export const PowerIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M13.5 3H11.5V13H13.5V3ZM18.33 5.17L16.91 6.59C18.49 7.86 19.5 9.81 19.5 12C19.5 15.87 16.37 19 12.5 19C8.63 19 5.5 15.87 5.5 12C5.5 9.81 6.51 7.86 8.08 6.58L6.67 5.17C4.73 6.82 3.5 9.26 3.5 12C3.5 16.97 7.53 21 12.5 21C17.47 21 21.5 16.97 21.5 12C21.5 9.26 20.27 6.82 18.33 5.17Z"
      />
    </SvgIcon>
  );
};

export const ArrowDownIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 25 24" fill="none">
      <path d="M7.5 9.5L12.5 14.5L17.5 9.5H7.5Z" fill="currentColor" />
    </SvgIcon>
  );
};

export const ChevronIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M16.59 8.295L12 12.875L7.41 8.295L6 9.705L12 15.705L18 9.705L16.59 8.295Z"
      />
    </SvgIcon>
  );
};

export const OpenInNewIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 25 24" fill="none">
      <path
        fill="currentColor"
        d="M19.2 19H5.19995V5H12.2V3H5.19995C4.08995 3 3.19995 3.9 3.19995 5V19C3.19995 20.1 4.08995 21 5.19995 21H19.2C20.3 21 21.2 20.1 21.2 19V12H19.2V19ZM14.2 3V5H17.79L7.95995 14.83L9.36995 16.24L19.2 6.41V10H21.2V3H14.2Z"
      />
    </SvgIcon>
  );
};

export const CalendarIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 3H19V1H17V3H7V1H5V3H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM20 21H4V8H20V21Z"
        fill="#D4CFFF"
      />
    </SvgIcon>
  );
};

export const ApiKeyIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M21 10H12.65C11.83 7.67 9.61 6 7 6C3.69 6 1 8.69 1 12C1 15.31 3.69 18 7 18C9.61 18 11.83 16.33 12.65 14H13L15 16L17 14L19 16L23 11.96L21 10ZM7 15C5.35 15 4 13.65 4 12C4 10.35 5.35 9 7 9C8.65 9 10 10.35 10 12C10 13.65 8.65 15 7 15Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
};

export const EditIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M2.99902 17.2515V21.0015H6.74902L17.809 9.94152L14.059 6.19152L2.99902 17.2515ZM20.709 7.04152C21.099 6.65152 21.099 6.02152 20.709 5.63152L18.369 3.29152C17.979 2.90152 17.349 2.90152 16.959 3.29152L15.129 5.12152L18.879 8.87152L20.709 7.04152Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
};

export const DeleteIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
};

export const CloseIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 34 34" fill="none">
      <path
        fill="currentColor"
        d="M26.7228 9.23568L24.7644 7.27734L17.0005 15.0412L9.23665 7.27734L7.27832 9.23568L15.0422 16.9996L7.27832 24.7635L9.23665 26.7218L17.0005 18.9579L24.7644 26.7218L26.7228 24.7635L18.9589 16.9996L26.7228 9.23568Z"
      />
    </SvgIcon>
  );
};

export const SuccessIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 34 34" fill="none">
      <path
        fill="currentColor"
        d="M12.5486 22.3822L6.75689 16.5905L4.78467 18.5489L12.5486 26.3127L29.2152 9.64608L27.2569 7.68774L12.5486 22.3822Z"
      />
    </SvgIcon>
  );
};

export const MiniChartIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 196 30" fill="none">
      <path
        d="M2.54545 29.0938L0 30.75V41H196V4.00457C193.455 2.38514 188.364 -0.853715 183.273 0.210238C178.182 1.27419 173.091 6.64095 168 9.48305C162.909 12.3252 157.818 12.6426 152.727 11.9932C147.636 11.3439 142.545 9.7278 137.455 10.0066C132.364 10.2854 127.273 12.4591 122.182 11.4228C117.091 10.3865 112 6.14022 106.909 4.91503C101.818 3.68985 96.7273 5.48574 91.6364 8.67251C86.5455 11.8593 81.4545 16.4369 76.3636 16.7306C71.2727 17.0243 66.1818 13.0342 61.0909 13.7128C56 14.3915 50.9091 19.739 45.8182 20.5219C40.7273 21.3049 35.6364 17.5233 30.5455 16.811C25.4545 16.0986 20.3636 18.4557 15.2727 21.2904C10.1818 24.1251 5.09091 27.4375 2.54545 29.0938Z"
        fill="url(#paint0_linear_1935_19502)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_1935_19502"
          x1="98"
          y1="0"
          x2="98"
          y2="43"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.290598" stopColor="#CACFE8" stopOpacity="0.3" />
          <stop offset="1" stopColor="#E9ECFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <svg width="196" height="30" viewBox="0.5 0.5 196 30" fill="none">
        <path
          d="M1 31.7948L3.54545 30.1361C6.09091 28.4775 11.1818 25.1602 16.2727 22.3214C21.3636 19.4825 26.4545 17.1221 31.5455 17.8354C36.6364 18.5488 41.7273 22.3359 46.8182 21.5518C51.9091 20.7677 57 15.4124 62.0909 14.7328C67.1818 14.0531 72.2727 18.0491 77.3636 17.755C82.4545 17.4608 87.5455 12.8765 92.6364 9.68513C97.7273 6.49373 102.818 4.69522 107.909 5.92219C113 7.14916 118.091 11.4016 123.182 12.4394C128.273 13.4772 133.364 11.3003 138.455 11.0212C143.545 10.742 148.636 12.3604 153.727 13.0107C158.818 13.661 163.909 13.3431 169 10.4969C174.091 7.65062 179.182 2.27605 184.273 1.21054C189.364 0.145042 194.455 3.38861 197 5.0104"
          stroke="#D4CFFF"
        />
      </svg>
    </SvgIcon>
  );
};
