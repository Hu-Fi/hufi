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