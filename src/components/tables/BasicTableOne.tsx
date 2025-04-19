"use client"
import React, { useState, useMemo } from "react";
import { Column, FilterOption } from "./tabletype";
import FormInModal from "../example/ModalExample/FormInModal";

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  inputfiled?: React.ReactNode;
  submitbutton?: React.ReactNode;
  title?: string;
  searchKey?: keyof T;
  classname?: string;
  rowsPerPage?: number;

};

export function ReusableTable<T extends object>({
  data,
  columns,
  filterOptions = [],
  filterKey,
  searchKey,
  classname,
  title,
  submitbutton,
  inputfiled,

  rowsPerPage = 5,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  // Filtered and searched data
  const filteredData = useMemo(() => {
    let d = [...data];
    if (filter && filterKey) {
      d = d.filter((row) => String(row[filterKey]) === filter);
    }
    if (search && searchKey) {
      d = d.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(search.toLowerCase())
      );
    }
    return d;
  }, [data, filter, filterKey, search, searchKey]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Handlers
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  React.useEffect(() => {
    setPage(1);
  }, [filter, search]);

  return (
    <div className="p-4 bg-white rounded shadow w-full">
      <div className="flex gap-2 mb-4">
        <div className="flex gap-2 flex-1">
          {filterOptions.length > 0 && filterKey && (
            <select
              className="border rounded px-2 py-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {searchKey && (
            <input
              type="text"
              placeholder="Search..."
              className="border rounded px-2 py-1 flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>

        <div className="ml-auto">
          <FormInModal inputfiled={inputfiled} title={title} submitbutton={submitbutton} classname={classname} />
        </div>
      </div>

      <table className="container  border">
        <thead>
          <tr>
            {/* Add SR Number column header */}
            <th className="border px-2 py-1 text-left">SR No.</th>
            {columns.map((col) => (
              <th key={String(col.key)} className="border px-2 py-1 text-left">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-4">
                No data found.
              </td>
            </tr>
          ) : (
            paginatedData.map((row, idx) => (
              <tr key={idx}>
                {/* Add SR Number cell */}
                <td className="border px-2 py-1">
                  {idx + 1}
                </td>
                {columns.map((col) => (
                  <td key={`${String(col.key)}-${idx}`} className="border px-2 py-1">
                    {col.render
                      ? col.render(row)
                      : col.accessor
                        ? String(row[col.accessor])
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4">
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === 1}
            onClick={handlePrev}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === totalPages || totalPages === 0}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
