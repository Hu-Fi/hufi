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

export const ChartIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M21 5.47L12 12L7.62 7.62L3 11V8.52L7.83 5L12.21 9.38L21 3V5.47ZM21 15H16.3L12.13 18.34L6 12.41L3 14.54V17L5.8 15L12 21L17 17H21V15Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
};

export const WalletIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M16 13C16 13.8284 16.6716 14.5 17.5 14.5C18.3284 14.5 19 13.8284 19 13C19 12.1716 18.3284 11.5 17.5 11.5C16.6716 11.5 16 12.1716 16 13Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11 19H16C18.8284 19 20.2426 19 21.1213 18.1213C22 17.2426 22 15.8284 22 13V12C22 9.17157 22 7.75736 21.1213 6.87868C20.48 6.23738 19.5534 6.06413 18 6.01732M10 6H16C16.7641 6 17.425 6 18 6.01732M2 10C2 6.22876 2 5.34315 3.17157 4.17157C4.34315 3 6.22876 3 10 3H14.9827C15.9308 3 16.4049 3 16.7779 3.15749C17.2579 3.36014 17.6399 3.7421 17.8425 4.22208C18 4.5951 18 5.06917 18 6.01732"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.125 19.5L3.125 13.5M5 13.5V12M5 21V19.5M3.125 16.5H6.875M6.875 16.5C7.49632 16.5 8 17.0037 8 17.625V18.375C8 18.9963 7.49632 19.5 6.875 19.5H2M6.875 16.5C7.49632 16.5 8 15.9963 8 15.375V14.625C8 14.0037 7.49632 13.5 6.875 13.5H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const FilterIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5H2M6 12H18M9 19H15M16 5H22M19 8V2"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const ArrowLeftIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 19L5 12M5 12L12 5M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const TableViewIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 18 18" fill="none">
      <path
        d="M14.6756 14.6754C13.6602 15.6907 12.0261 15.6907 8.75778 15.6907C5.48947 15.6907 3.85531 15.6907 2.83998 14.6754C1.82464 13.6601 1.82464 12.0259 1.82464 8.7576C1.82464 5.48929 1.82464 3.85513 2.83998 2.8398C3.85531 1.82446 5.48947 1.82446 8.75778 1.82446C12.0261 1.82446 13.6602 1.82446 14.6756 2.8398C15.6909 3.85513 15.6909 5.48929 15.6909 8.7576C15.6909 12.0259 15.6909 13.6601 14.6756 14.6754Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6909 6.20337L1.82464 6.20337"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M15.6909 11.312L1.82464 11.312"
        stroke="currentColor"
        strokeWidth="1"
      />
    </SvgIcon>
  );
};

export const GridViewIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 18 18" fill="none">
      <path
        d="M14.6767 2.84012C15.6921 3.85554 15.6921 5.48982 15.6921 8.75839C15.6921 12.027 15.6921 13.6612 14.6767 14.6767C13.6612 15.6921 12.027 15.6921 8.75839 15.6921C5.48982 15.6921 3.85553 15.6921 2.84012 14.6767C1.82471 13.6612 1.82471 12.027 1.82471 8.75839C1.82471 5.48982 1.82471 3.85553 2.84012 2.84012C3.85554 1.82471 5.48982 1.82471 8.75839 1.82471C12.027 1.82471 13.6612 1.82471 14.6767 2.84012Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6919 8.7583L1.82453 8.7583"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M8.7583 1.82471L8.7583 15.6921"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
};

export const LinkIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 16 16" fill="none">
      <g clipPath="url(#clip0_890_8119)" fill="none">
        <path
          d="M6.6668 8.66795C6.9531 9.0507 7.31837 9.3674 7.73783 9.59657C8.1573 9.82574 8.62114 9.96202 9.0979 9.99617C9.57466 10.0303 10.0532 9.96152 10.501 9.79447C10.9489 9.62741 11.3555 9.36599 11.6935 9.02795L13.6935 7.02795C14.3007 6.39927 14.6366 5.55726 14.629 4.68328C14.6215 3.80929 14.2709 2.97324 13.6529 2.35522C13.0348 1.73719 12.1988 1.38663 11.3248 1.37903C10.4508 1.37144 9.60881 1.70742 8.98013 2.31461L7.83347 3.45461M9.33347 7.33461C9.04716 6.95186 8.68189 6.63516 8.26243 6.40599C7.84297 6.17681 7.37913 6.04054 6.90237 6.00639C6.4256 5.97225 5.94708 6.04103 5.49924 6.20809C5.0514 6.37515 4.64472 6.63657 4.3068 6.97461L2.3068 8.97461C1.69961 9.60329 1.36363 10.4453 1.37122 11.3193C1.37881 12.1933 1.72938 13.0293 2.3474 13.6473C2.96543 14.2654 3.80147 14.6159 4.67546 14.6235C5.54945 14.6311 6.39146 14.2951 7.02013 13.6879L8.16013 12.5479"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </SvgIcon>
  );
};

export const ConnectWalletIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 18 18" fill="none">
      <path
        d="M12.6347 10.9572L14.5919 9C16.136 7.45584 16.136 4.95227 14.5919 3.40812C13.0477 1.86396 10.5442 1.86396 9 3.40812L7.04284 5.36528M10.9572 12.6347L9 14.5919C7.45584 16.136 4.95227 16.136 3.40812 14.5919C1.86396 13.0477 1.86396 10.5442 3.40812 9L5.36528 7.04284"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
      />
      <path
        d="M16.5 12.75H14.9408M12.75 16.5L12.75 14.9408"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 5.25H3.05917M5.25 1.5L5.25 3.05917"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const MobileBottomNavIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 36 35" fill="none">
      <path
        d="M15 25C17.2091 25 19 26.7909 19 29V31C19 33.2091 17.2091 35 15 35H8C5.79086 35 4 33.2091 4 31V29C4 26.7909 5.79086 25 8 25H15ZM32 17C34.2091 17 36 18.7909 36 21V31C36 33.2091 34.2091 35 32 35H25C22.7909 35 21 33.2091 21 31V21C21 18.7909 22.7909 17 25 17H32ZM15 5C17.2091 5 19 6.79086 19 9V19C19 21.2091 17.2091 23 15 23H8C5.79086 23 4 21.2091 4 19V9C4 6.79086 5.79086 5 8 5H15ZM32 5C34.2091 5 36 6.79086 36 9V11C36 13.2091 34.2091 15 32 15H25C22.7909 15 21 13.2091 21 11V9C21 6.79086 22.7909 5 25 5H32Z"
        fillOpacity="0.1"
      />
      <rect
        x="0.5"
        y="0.5"
        width="14"
        height="17"
        rx="3.5"
        stroke="currentColor"
      />
      <rect
        x="0.5"
        y="20.5"
        width="14"
        height="9"
        rx="3.5"
        stroke="currentColor"
      />
      <rect
        x="31.5"
        y="29.5"
        width="14"
        height="17"
        rx="3.5"
        transform="rotate(-180 31.5 29.5)"
        stroke="currentColor"
      />
      <rect
        x="31.5"
        y="9.5"
        width="14"
        height="9"
        rx="3.5"
        transform="rotate(-180 31.5 9.5)"
        stroke="currentColor"
      />
      <defs>
        <linearGradient
          id="paint0_linear_1154_3379"
          x1="8"
          y1="6.5"
          x2="20"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.13" />
        </linearGradient>
      </defs>
    </SvgIcon>
  );
};
