import type { FC } from 'react';

import MuiTablePagination from '@mui/material/TablePagination';

type Props = {
  page: number;
  resultsLength: number;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  setNextPage: () => void;
  setPrevPage: () => void;
  hasMore?: boolean;
};

const CampaignsTablePagination: FC<Props> = ({
  page,
  resultsLength,
  hasMore,
  pageSize,
  setPageSize,
  setNextPage,
  setPrevPage,
}) => {
  return (
    <MuiTablePagination
      count={Number.MAX_SAFE_INTEGER}
      component="div"
      rowsPerPageOptions={[10, 25, 50]}
      rowsPerPage={pageSize}
      page={page}
      onPageChange={() => {}}
      onRowsPerPageChange={(event) => {
        setPageSize(Number(event.target.value));
      }}
      labelDisplayedRows={({ from, to }) => {
        const effectiveTo = resultsLength ? from + resultsLength - 1 : to;
        return `${from}–${effectiveTo}`;
      }}
      slotProps={{
        root: {
          sx: {
            mt: { xs: -2, md: 0 },
            '& .MuiTablePagination-spacer': {
              display: { xs: 'none', md: 'block' },
            },
          },
        },
        actions: {
          nextButton: {
            disabled: !hasMore,
            onClick: setNextPage,
          },
          previousButton: {
            onClick: setPrevPage,
          },
        },
      }}
    />
  );
};

export default CampaignsTablePagination;
