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

export const CopyIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 20 20" fill="none">
      <g clipPath="url(#clip0_1586_816)">
        <path
          d="M3.33317 13.3332C2.4165 13.3332 1.6665 12.5832 1.6665 11.6665V3.33317C1.6665 2.4165 2.4165 1.6665 3.33317 1.6665H11.6665C12.5832 1.6665 13.3332 2.4165 13.3332 3.33317M8.33317 6.6665H16.6665C17.587 6.6665 18.3332 7.4127 18.3332 8.33317V16.6665C18.3332 17.587 17.587 18.3332 16.6665 18.3332H8.33317C7.4127 18.3332 6.6665 17.587 6.6665 16.6665V8.33317C6.6665 7.4127 7.4127 6.6665 8.33317 6.6665Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </SvgIcon>
  );
};

export const MobileBottomNavDashboardIcon: FC<SvgIconProps> = (props) => {
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

export const MobileBottomNavCampaignsIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 36 36" fill="none">
      <g clipPath="url(#clip0_2502_11391)">
        <path
          d="M19.1759 9.23877L12.9289 18.3768C12.4481 19.0801 11.7836 19.5704 10.9655 19.8263C10.43 19.9939 10.1623 20.0776 9.95877 20.166C7.4319 21.264 7.03757 23.9933 8.2832 26.1508L8.9668 27.3348C10.2124 29.4923 12.7732 30.5154 14.9875 28.8761C15.1658 28.7441 15.3723 28.5541 15.7851 28.1741C16.4158 27.5936 17.1727 27.2632 18.0221 27.1985L29.0594 26.3574C31.5931 26.1643 32.8599 26.0678 33.7516 25.0581C34.6432 24.0485 34.563 23.033 34.4027 21.0019C33.9622 15.4245 31.0955 10.4592 26.4856 7.28913C24.8068 6.1347 23.9674 5.55748 22.6472 5.82485C21.327 6.09223 20.61 7.14108 19.1759 9.23877Z"
          fill="url(#paint0_linear_2502_11391)"
        />
        <path
          d="M16.1095 5.94697L9.86249 15.085C9.38169 15.7883 8.7172 16.2785 7.89904 16.5345C7.36361 16.702 7.09586 16.7858 6.89237 16.8742C4.3655 17.9722 3.97116 20.7015 5.21679 22.859L5.90039 24.043C7.14603 26.2005 9.70682 27.2236 11.9211 25.5843C12.0994 25.4523 12.3059 25.2622 12.7186 24.8823C13.3494 24.3018 14.1063 23.9714 14.9557 23.9067L25.993 23.0656C28.5267 22.8725 29.7935 22.776 30.6852 21.7663C31.5768 20.7567 31.4966 19.7411 31.3362 17.7101C30.8958 12.1327 28.0291 7.16741 23.4192 3.99733C21.7404 2.84289 20.901 2.26567 19.5808 2.53304C18.2606 2.80042 17.5436 3.84927 16.1095 5.94697Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.4838 31.1662L21.7177 31.4354C23.63 31.6658 24.5861 31.781 25.1661 31.5124C25.9395 31.1543 26.4441 30.39 26.4697 29.5381C26.4888 28.8992 26.0073 28.0652 25.0442 26.3971L24.6692 25.7476L15 27L16.125 28.9486C17.0414 30.5358 17.6643 30.947 19.4838 31.1662Z"
          fill="url(#paint1_linear_2502_11391)"
        />
        <path
          d="M23.0489 23.7452L23.4239 24.3947C24.3869 26.0628 24.8685 26.8968 24.8493 27.5357C24.8238 28.3876 24.3191 29.1519 23.5458 29.51C22.9658 29.7786 22.0096 29.6634 20.0973 29.433L17.8635 29.1638C16.0439 28.9446 15.421 28.5334 14.5046 26.9461L13.3796 24.9976"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.6543 23.9731L9.1543 16.1789"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_2502_11391"
          x1="14.6913"
          y1="10.25"
          x2="25.9413"
          y2="29.7356"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" stopOpacity="0.13" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.13" />
        </linearGradient>
      </defs>
    </SvgIcon>
  );
};

export const WarningIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 20 20" fill="none">
      <path
        d="M4.43411 8.06683C6.4455 4.50771 7.4512 2.72815 8.83123 2.27006C9.59044 2.01805 10.4083 2.01805 11.1675 2.27006C12.5475 2.72815 13.5532 4.50771 15.5646 8.06683C17.576 11.6259 18.5817 13.4055 18.28 14.8555C18.114 15.6532 17.7051 16.3768 17.1119 16.9225C16.0335 17.9144 14.0221 17.9144 9.99935 17.9144C5.97655 17.9144 3.96516 17.9144 2.88682 16.9225C2.29358 16.3768 1.88467 15.6532 1.7187 14.8555C1.41701 13.4055 2.42271 11.6259 4.43411 8.06683Z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="1.6625"
      />
      <path
        d="M10.2005 14.1662V10.8328C10.2005 10.44 10.2005 10.2436 10.0785 10.1216C9.95644 9.99951 9.76002 9.99951 9.36719 9.99951"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="1.6625"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.99203 7.49951H9.99951"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="1.6625"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const RefreshIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 16 16" fill="none">
      <path
        d="M14 8C14 9.18669 13.6481 10.3467 12.9888 11.3334C12.3295 12.3201 11.3925 13.0892 10.2961 13.5433C9.19975 13.9974 7.99335 14.1162 6.82946 13.8847C5.66558 13.6532 4.59648 13.0818 3.75736 12.2426C2.91825 11.4035 2.3468 10.3344 2.11529 9.17054C1.88378 8.00666 2.0026 6.80026 2.45673 5.7039C2.91085 4.60754 3.67989 3.67047 4.66658 3.01118C5.65328 2.35189 6.81331 2 8 2C9.68 2 11.2867 2.66667 12.4933 3.82667L14 5.33333M14 5.33333V2M14 5.33333H10.6667"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const NoKeysIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 47 47" fill="none">
      <circle
        cx="22.8478"
        cy="23.7223"
        r="16.8146"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <rect
        x="33.5312"
        y="10.46"
        width="2.87378"
        height="32.6271"
        transform="rotate(45 33.5312 10.46)"
        fill="currentColor"
      />
      <rect
        x="10.4092"
        y="12.6621"
        width="2.87756"
        height="32.6271"
        transform="rotate(-45 10.4092 12.6621)"
        fill="current Color"
      />
    </SvgIcon>
  );
};

export const CampaignIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 52 52" fill="none">
      <path
        d="M5.41602 25.9998C5.41602 16.2968 5.41602 11.4452 8.43038 8.43086C11.4447 5.4165 16.2963 5.4165 25.9993 5.4165C35.7024 5.4165 40.554 5.4165 43.5683 8.43086C46.5827 11.4452 46.5827 16.2968 46.5827 25.9998C46.5827 35.7029 46.5827 40.5545 43.5683 43.5688C40.554 46.5832 35.7024 46.5832 25.9993 46.5832C16.2963 46.5832 11.4447 46.5832 8.43038 43.5688C5.41602 40.5545 5.41602 35.7029 5.41602 25.9998Z"
        fill="none"
        stroke="#D4CFFF"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46.5827 29.25H35.9104C34.0858 29.25 32.6523 30.7744 31.8482 32.3857C30.9746 34.1361 29.2252 35.75 25.9993 35.75C22.7735 35.75 21.0241 34.1361 20.1505 32.3857C19.3464 30.7744 17.9129 29.25 16.0883 29.25H5.41602"
        fill="none"
        stroke="#D4CFFF"
        strokeWidth="3.25"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const BigFilterIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 52 52" fill="none">
      <path
        d="M45.4971 9.75C45.4717 8.80759 45.2738 8.1325 44.7894 7.59937C43.7907 6.5 42.0246 6.5 38.4923 6.5H13.5077C9.97542 6.5 8.20928 6.5 7.21057 7.59937C6.21185 8.69874 6.43091 10.4017 6.86904 13.8077C6.99699 14.8024 7.20979 15.3671 7.85923 16.1388C9.95721 18.6315 13.7995 23.0655 19.1912 27.0965C19.6839 27.4648 20.0072 28.0669 20.0618 28.733C20.6691 36.1538 21.2256 41.2233 21.521 43.7186C21.676 45.0276 23.1271 46.0344 24.323 45.1888C26.3319 43.7679 30.0847 42.1757 30.5806 39.5291C30.7636 38.5524 31.0128 37.0073 31.2975 34.6667"
        fill="none"
        stroke="#D4CFFF"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45.5 15.1665L32.5 28.1665M45.5 28.1665L32.5 15.1665"
        fill="none"
        stroke="#D4CFFF"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
};

export const LockIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 52 52" fill="none">
      <path
        d="M38.9997 23.8423C37.7356 21.4869 35.2578 19.8418 32.3955 19.7151C29.1999 19.5738 25.9538 19.5 22.3791 19.5C18.8044 19.5 15.5583 19.5738 12.3628 19.7151C8.56511 19.8832 5.4444 22.7242 4.93713 26.3505C4.60606 28.7171 4.33301 31.1424 4.33301 33.6123C4.33301 36.0823 4.60606 38.5076 4.93713 40.8742C5.4444 44.5005 8.56512 47.3415 12.3628 47.5096C13.9099 47.578 15.7306 47.6306 17.333 47.6667"
        fill="none"
        stroke="#D4CFFF"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <path
        d="M13 19.5002V14.0835C13 8.69872 17.3652 4.3335 22.75 4.3335C28.1348 4.3335 32.5 8.69872 32.5 14.0835V19.5002"
        fill="none"
        stroke="#D4CFFF"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45.9429 32.7267L44.6854 34.0074V34.0074L45.9429 32.7267ZM46.4088 35.6996C47.1161 36.3941 48.2525 36.3837 48.9471 35.6764C49.6416 34.9691 49.6312 33.8327 48.9239 33.1382L47.6663 34.4189L46.4088 35.6996ZM39.0492 32.7267L37.7916 31.446V31.446L39.0492 32.7267ZM39.5151 39.0841C40.2224 39.7786 41.3588 39.7682 42.0533 39.0609C42.7478 38.3536 42.7374 37.2172 42.0301 36.5226L40.7726 37.8034L39.5151 39.0841ZM32.1545 46.2649L30.897 44.9842C29.6915 46.1679 27.7237 46.1679 26.5183 44.9842L25.2608 46.2649L24.0032 47.5457C26.6051 50.1004 30.8102 50.1004 33.412 47.5457L32.1545 46.2649ZM25.2608 46.2649L26.5183 44.9842C25.3311 43.8185 25.3311 41.9424 26.5183 40.7767L25.2608 39.496L24.0032 38.2153C21.3831 40.788 21.3831 44.973 24.0032 47.5457L25.2608 46.2649ZM25.2608 39.496L26.5183 40.7767C27.7237 39.5931 29.6915 39.5931 30.897 40.7767L32.1545 39.496L33.412 38.2153C30.8102 35.6606 26.6051 35.6606 24.0032 38.2153L25.2608 39.496ZM32.1545 39.496L30.897 40.7767C32.0842 41.9424 32.0842 43.8185 30.897 44.9842L32.1545 46.2649L33.412 47.5457C36.0322 44.973 36.0322 40.788 33.412 38.2153L32.1545 39.496ZM45.9429 32.7267L44.6854 34.0074L46.4088 35.6996L47.6663 34.4189L48.9239 33.1382L47.2004 31.446L45.9429 32.7267ZM32.1545 39.496L33.412 40.7768L38.5832 35.6997L37.3257 34.4189L36.0683 33.1381L30.897 38.2153L32.1545 39.496ZM37.3257 34.4189L38.5832 35.6996L40.3067 34.0074L39.0492 32.7267L37.7916 31.446L36.0682 33.1382L37.3257 34.4189ZM37.3257 34.4189L36.0682 35.6996L39.5151 39.0841L40.7726 37.8034L42.0301 36.5226L38.5832 33.1382L37.3257 34.4189ZM45.9429 32.7267L47.2004 31.446C46.424 30.6836 45.716 29.9831 45.0649 29.4953C44.3711 28.9755 43.541 28.5386 42.496 28.5386V30.3335V32.1284C42.4979 32.1284 42.5076 32.126 42.5519 32.1441C42.61 32.1679 42.7228 32.2261 42.9126 32.3683C43.3263 32.6782 43.837 33.1743 44.6854 34.0074L45.9429 32.7267ZM39.0492 32.7267L40.3067 34.0074C41.1551 33.1743 41.6658 32.6782 42.0795 32.3683C42.2693 32.2261 42.3821 32.1679 42.4402 32.1441C42.4845 32.126 42.4942 32.1284 42.496 32.1284V30.3335V28.5386C41.451 28.5386 40.621 28.9755 39.9272 29.4953C39.2761 29.9831 38.5681 30.6836 37.7916 31.446L39.0492 32.7267Z"
        fill="#D4CFFF"
      />
    </SvgIcon>
  );
};
