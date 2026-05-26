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
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#43ba96',
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: '#251d47',
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
    backgroundColor: '#251d47',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

export const FormControlLabelStyled = styled(FormControlLabel, {
  shouldForwardProp: (prop) => prop !== 'borderColor',
})<{ borderColor: string }>(({ borderColor }) => ({
  border: '1px solid',
  borderColor,
  borderRadius: 40,
  padding: '0px 16px',
  margin: 0,
  minWidth: 150,
  gap: 3,
  '& .MuiFormControlLabel-label': {
    color: 'white',
    fontSize: 16,
    fontWeight: 500,
    lineHeight: '150%',
    letterSpacing: 0,
    marginRight: 'auto',
  },
}));

export const Row = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  borderTop: '1px solid #3a2e6f',
  minHeight: 140,
});

export const CheckboxIcon = () => (
  <Box
    sx={{
      width: 20,
      height: 20,
      borderRadius: '20px',
      border: '1px solid #3a2e6f',
      bgcolor: '#2d254e',
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
      bgcolor: 'error.main',
    }}
  >
    <CheckIcon sx={{ color: '#ffffff', fontSize: 16 }} />
  </Box>
);
