"use client";
import React, { useState, useMemo } from "react";
import { Column, FilterOption } from "./tabletype";

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

export function Simpletableshowdata<T extends object>({
  data,
  columns,
  filterOptions = [],
  filterKey,
  rowsPerPage = 5,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  const handleSort = (key: keyof T) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const filteredData = useMemo(() => {
    let d = [...data];

    if (filter && filterKey) {
      d = d.filter((row) => String(row[filterKey]) === filter);
    }

    if (search) {
      d = d.filter((row) => {
        return columns.some((col) => {
          if (!col.accessor) return false;
          const value = row[col.accessor];
          if (value === undefined || value === null) return false;
          return String(value).toLowerCase().includes(search.toLowerCase());
        });
      });
    }

    if (sortConfig.key) {
      d.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (aString < bString) return sortConfig.direction === "asc" ? -1 : 1;
        if (aString > bString) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return d;
  }, [data, filter, filterKey, search, columns, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  React.useEffect(() => {
    setPage(1);
  }, [filter, search]);

  return (
    <div className="p-4 bg-white rounded-lg w-full mx-auto border">
      {/* Filter/Search Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2 flex-1">
          {filterOptions.length > 0 && filterKey && (
            <select
              className="border rounded-lg px-3 py-2 w-full md:w-auto"
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
          <input
            type="text"
            placeholder="Search..."
            className="border rounded-lg px-3 py-2 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full min-w-[600px] border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300">SR No.</th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300 cursor-pointer last:border-r-0"
                  onClick={() => col.accessor && handleSort(col.accessor)}
                >
                  {col.label}
                  {sortConfig.key === col.accessor && (
                    <span className="ml-1">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-6 text-center text-gray-500 border-t border-gray-300"
                >
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                    {(page - 1) * rowsPerPage + idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={`${String(col.key)}-${idx}`}
                      className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
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
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length}
        </div>

        <div className="flex gap-2 whitespace-nowrap w-full">
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            disabled={page === 1}
            onClick={handlePrev}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
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
