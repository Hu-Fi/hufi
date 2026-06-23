import { Paper, Skeleton, Stack } from '@mui/material';

const SkeletonCard = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1.5,
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'border.strong',
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Skeleton variant="text" width={140} height={22.5} />
        <Skeleton variant="text" width={125} height={20} />
      </Stack>
      <Stack
        sx={{
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        <Skeleton variant="text" width={150} height={22} />
        <Skeleton variant="text" width={150} height={20} />
      </Stack>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Skeleton variant="rectangular" height={85} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={85} sx={{ flex: 1 }} />
      </Stack>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Skeleton variant="rectangular" height={44} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={44} sx={{ flex: 1 }} />
      </Stack>
    </Paper>
  );
};

export default SkeletonCard;
