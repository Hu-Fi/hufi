import CheckIcon from '@mui/icons-material/Check';
import {
  Box,
  FormControlLabel,
  styled,
  Switch,
  type SwitchProps,
} from '@mui/material';

export const SwitchStyled = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 52,
  height: 28,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 4,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(26px)',
      color: theme.palette.neutral['100'],
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.neutral['200'],
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.neutral['200'],
      border: '6px solid',
      borderColor: theme.palette.neutral['100'],
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.primary['200'],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
    },
  },
  '& .MuiSwitch-thumb': {
    width: 20,
    height: 20,
  },
  '& .MuiSwitch-track': {
    borderRadius: 999,
    backgroundColor: theme.palette.primary['100'],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },

  '@media (max-width: 900px)': {
    width: 40,
    height: 22,
    '& .MuiSwitch-switchBase': {
      '&.Mui-checked': {
        transform: 'translateX(18px)',
      },
    },
    '& .MuiSwitch-thumb': {
      width: 14,
      height: 14,
    },
  },
}));

export const FormControlLabelStyled = styled(FormControlLabel)(({ theme }) => ({
  border: '1px solid',
  borderRadius: 40,
  padding: '0px 16px',
  margin: 0,
  minWidth: 150,
  gap: 3,
  '& .MuiFormControlLabel-label': {
    color: theme.palette.neutral['100'],
    fontSize: 16,
    fontWeight: 500,
    lineHeight: '150%',
    letterSpacing: 0,
    marginRight: 'auto',
  },

  '@media (max-width: 900px)': {
    padding: '0px 12px',
    gap: '12px',
    minWidth: 120,
    '& .MuiFormControlLabel-label': {
      fontSize: 14,
    },
  },
}));

export const Row = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  borderTop: '1px solid',
  borderColor: theme.palette.border.strong,
  minHeight: 140,

  '@media (max-width: 900px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
    padding: '24px 16px',
  },
}));

export const CheckboxIcon = () => (
  <Box
    sx={{
      width: 20,
      height: 20,
      bgcolor: 'primary.200',
      borderRadius: '20px',
      border: '1px solid',
      borderColor: 'border.strong',
    }}
  />
);

export const CheckboxCheckedIcon = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      borderRadius: '20px',
      bgcolor: 'accent.main',
    }}
  >
    <CheckIcon sx={{ color: 'neutral.100', fontSize: 16 }} />
  </Box>
);
