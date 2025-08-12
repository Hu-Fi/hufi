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
  setPage: (page: number) => void;
  setNextPage: () => void;
  setPrevPage: () => void;
  setPageSize: (pageSize: number) => void;
};

const INITIAL_PAGE_SIZE = 1;

const usePagination = (): PaginationState => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);

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
    setPage,
    setNextPage,
    setPrevPage,
    setPageSize: handleSetPageSize,
  };
};

export default usePagination;
