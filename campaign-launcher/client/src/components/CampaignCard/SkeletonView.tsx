import { Paper, Skeleton, Stack } from '@mui/material';

const SkeletonCard = () => {
  return (
    <Paper
      sx={{
        display: 'flex',
        p: 2,
        gap: 1.5,
        flexDirection: 'column',
        bgcolor: '#251d47',
        borderRadius: '8px',
        border: '1px solid #433679',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton variant="text" width={140} height={28} />
        <Skeleton variant="text" width={125} height={28} />
      </Stack>
      <Stack justifyContent="center" gap={1}>
        <Skeleton variant="text" width={150} height={30} />
        <Skeleton variant="text" width={150} height={20} />
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <Skeleton variant="rectangular" height={90} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={90} sx={{ flex: 1 }} />
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <Skeleton variant="rectangular" height={44} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={44} sx={{ flex: 1 }} />
      </Stack>
    </Paper>
  );
};

export default SkeletonCard;
