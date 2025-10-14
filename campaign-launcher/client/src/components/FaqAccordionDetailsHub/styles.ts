export const smallAccordionProps = {
  transition: { unmountOnExit: true },
  root: {
    elevation: 2,
    sx: {
      backgroundColor: 'background.default',
      boxShadow: 'none',
      '&:before': {
        backgroundColor: 'background.default',
      },
      '&.Mui-expanded:before': {
        opacity: 1,
        display: 'block !important',
      },
    }
  }
}

export const firstSmallAccordionProps = {
  ...smallAccordionProps,
  root: {
    ...smallAccordionProps.root,
    sx: {
      ...smallAccordionProps.root.sx,
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
      '&:before': {
        display: 'none',
      },
      '&.Mui-expanded:before': {
        display: 'none',
      }
    }
  } 
}

export const smallAccordionSummaryProps = {
  root: {
    sx: {
      minHeight: '32px',
      px: {xs: '16px', md: '22px'},
      '& .MuiAccordionSummary-content': {
        my: '4px',
      },
    },
  }
}

export const smallAccordionDetailsProps = {
  px: { xs: '16px', md: '22px' },
}

export const listItemTextProps = {
  primary: {
    variant: 'body2',
  },
  root: {
    sx: { m: 0 },
  }
} as const

export const listItemWithMarkerProps = {
  display: 'list-item', 
  p: 0,
  '&::marker': {
    fontSize: '16px',
    lineHeight: '20px',
  }
} as const

export const listItemWithNumberProps = {
  display: 'list-item', 
  '&::marker': { 
    fontSize: '14px', 
    lineHeight: '20px',
    fontVariantNumeric: 'diagonal-fractions' 
  } 
} as const