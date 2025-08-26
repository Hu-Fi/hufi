import { useCallback, useState } from 'react';

type PaginationState = {
  params: {
    limit: number;
    skip: number;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  setNextPage: () => void;
  setPrevPage: () => void;
  setPageSize: (pageSize: number) => void;
};

const usePagination = (): PaginationState => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const skip = page * pageSize;

  const setNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const setPrevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  }, []);

  return {
    params: {
      limit: pageSize,
      skip,
    },
    pagination: {
      page,
      pageSize,
    },
    setNextPage,
    setPrevPage,
    setPageSize: handleSetPageSize,
  };
};

export default usePagination;
