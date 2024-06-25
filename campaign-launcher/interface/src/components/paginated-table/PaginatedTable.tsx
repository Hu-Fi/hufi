import { ReactNode, useState } from 'react';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

export type Column<T> = {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: unknown, row?: T) => ReactNode;
};

export type PaginatedTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowsPerPageOptions?: number[];
  onClickRow?: (row: T) => void;
};

export function PaginatedTable<T>({
  columns,
  data,
  rowsPerPageOptions = [5, 10, 25],
  onClickRow,
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id.toString()}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  <Typography>{column.label}</Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <TableRow
                    key={`row-${index}`}
                    onClick={() => onClickRow?.(row)}
                    sx={{
                      ...(onClickRow ? { cursor: 'pointer' } : {}),
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id.toString()}
                        align={column.align}
                      >
                        {column.format ? (
                          column.format(row[column.id], row)
                        ) : (
                          <Typography>
                            {row[column.id] as unknown as string}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
