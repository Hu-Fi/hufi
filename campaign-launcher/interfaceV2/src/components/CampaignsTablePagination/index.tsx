import { FC } from 'react';

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

const CampaignsTablePagination: FC<Props> = ({ page, resultsLength, hasMore, pageSize, setPageSize, setNextPage, setPrevPage }) => {
  return (
    <MuiTablePagination
      count={Number.MAX_SAFE_INTEGER}
      component="div"
      //rowsPerPageOptions={[5, 25, 50]}
      rowsPerPageOptions={[1,2,3]}
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
