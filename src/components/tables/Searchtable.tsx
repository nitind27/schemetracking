"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import Flatpickr from "react-flatpickr";
import { format } from 'date-fns';
import 'flatpickr/dist/flatpickr.css'; // Add this line for basic styling
import 'flatpickr/dist/themes/material_green.css'; // Add this line for theme

type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  label: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
};

type TabOption = {
  label: string;
  value: string;
};

type TabFilter<T> = {
  field: keyof T | string;
  tabs: TabOption[];
  defaultValue?: string;
  normalize?: boolean;
  fallbackFields?: (keyof T | string)[];
};

type Column<T> = {
  key: string;
  label: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  searchable?: boolean; // New property to enable column search
};

type DateRangeFilter = {
  startDateField: string;
  endDateField: string;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterGroup[];
  inputfiled?: React.ReactNode;
  submitbutton?: React.ReactNode;
  title?: string;
  searchKey?: string;
  classname?: string;
  tabFilter?: TabFilter<T>;
  enableColumnSearch?: boolean; // New prop to enable column-wise search
  dateRangeFilter?: DateRangeFilter; // Add this line
};

export function Searchtable<T extends object>({
  data,
  columns,
  filterOptions = [],
  searchKey,
  inputfiled,
  submitbutton,
  tabFilter,
  enableColumnSearch = false, // Default to false
  dateRangeFilter, // Add this line
  title,
  classname,
}: Props<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({}); // New state for column searches
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeTab] = useState<string>(
    tabFilter?.defaultValue ?? (tabFilter?.tabs?.[0]?.value ?? "")
  );

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");

  const reactColumns = useMemo(() => {
    const baseColumns = [
      {
        name: "SR No.",
        cell: (_row: T, index: number) =>
          perPage * (currentPage - 1) + index + 1,
        width: "80px",
      },
    ];

    const dataColumns = columns.map((col) => {
      const columnConfig: {
        name: string | React.ReactNode;
        selector: (row: T) => string;
        cell: (row: T) => React.ReactNode;
        sortable: boolean;
        width?: string;
      } = {
        name: col.label,
        selector: (row: T) =>
          col.accessor ? String(row[col.accessor] ?? "") : "",
        cell: col.render
          ? (row: T) => col.render?.(row)
          : (row: T) => (col.accessor ? String(row[col.accessor]) : ""),
        sortable: col.sortable !== false,
        width: col.width,
      };

      // Add column search input if enabled and column is searchable
      if (enableColumnSearch && col.searchable !== false) {
        columnConfig.name = (
          <div className="flex flex-col gap-1">
            <span>{col.label}</span>
            <input
              type="text"
              placeholder={`Search ${col.label}...`}
              className="text-xs px-2 py-1 border rounded"
              value={columnSearches[col.key] || ""}
              onChange={(e) => {
                setColumnSearches(prev => ({
                  ...prev,
                  [col.key]: e.target.value
                }));
                setCurrentPage(1); // Reset to first page when searching
              }}
              onClick={(e) => e.stopPropagation()} // Prevent row selection
            />
          </div>
        );
      }

      return columnConfig;
    });

    return [...baseColumns, ...dataColumns];
  }, [columns, perPage, currentPage, enableColumnSearch, columnSearches]);

  const filteredData = useMemo(() => {
    let tempData = [...data];

    // Apply tab filter first (if configured and not "All")
    if (tabFilter && activeTab !== "") {
      const targets = [tabFilter.field, ...(tabFilter.fallbackFields ?? [])];
      const targetVal = tabFilter.normalize
        ? normalize(String(activeTab))
        : String(activeTab);
      tempData = tempData.filter((row) => {
        const r = row as Record<string, unknown>;
        return targets.some((key) => {
          const raw = r[key as string];
          const value = raw == null ? "" : String(raw);
          const comp = tabFilter.normalize ? normalize(value) : value;
          return comp === targetVal;
        });
      });
    }

    // Apply date range filter
    if (dateRangeFilter) {
      tempData = tempData.filter((row) => {
        const r = row as Record<string, unknown>;
        const startDateValue = r[dateRangeFilter.startDateField];
        const endDateValue = r[dateRangeFilter.endDateField];
        
        if (!startDateValue && !endDateValue) return true;
        
        const rowStartDate = startDateValue ? new Date(String(startDateValue)) : null;
        const rowEndDate = endDateValue ? new Date(String(endDateValue)) : null;
        
        // Check if start date filter is applied
        if (dateRangeFilter.startDate && rowStartDate) {
          if (rowStartDate < dateRangeFilter.startDate) return false;
        }
        
        // Check if end date filter is applied
        if (dateRangeFilter.endDate && rowEndDate) {
          if (rowEndDate > dateRangeFilter.endDate) return false;
        }
        
        return true;
      });
    }

    // Apply multiple dropdown filters
    if (filterOptions.length > 0 && Object.keys(filters).length > 0) {
      tempData = tempData.filter((row) => {
        const r = row as Record<string, unknown>;
        return Object.entries(filters).every(([key, value]) => {
          if (!value || value === "") return true;
          const rowValue = r[key];
          if (rowValue == null || rowValue === undefined) return false;
          return String(rowValue).trim() === String(value).trim();
        });
      });
    }

    // Apply column-wise searches
    if (enableColumnSearch) {
      tempData = tempData.filter((row) => {
        const r = row as Record<string, unknown>;
        return Object.entries(columnSearches).every(([columnKey, searchValue]) => {
          if (!searchValue) return true;
          
          // Find the column to get the accessor
          const column = columns.find(col => col.key === columnKey);
          if (!column || !column.accessor) return true;
          
          const cellValue = String(r[column.accessor as string] ?? "");
          return cellValue.toLowerCase().includes(searchValue.toLowerCase());
        });
      });
    }

    // Column-specific search (existing functionality)
    if (search && searchKey) {
      tempData = tempData.filter((row) => {
        const r = row as Record<string, unknown>;
        const s = r[searchKey as string];
        return String(s ?? "").toLowerCase().includes(search.toLowerCase());
      });
    }
    // Global search (existing functionality)
    else if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row as Record<string, unknown>).some((v) =>
          String(v ?? "").toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [data, filters, search, searchKey, filterOptions, tabFilter, activeTab, enableColumnSearch, columnSearches, dateRangeFilter]);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const SubHeaderComponent = (
    <div className="space-y-4 w-full">
      {tabFilter?.tabs?.length ? (
        <div className="flex justify-between items-center flex-wrap gap-4">
          {/* Tabs on the left */}
          <div className="flex gap-2 flex-wrap">
            {/* Tab buttons can be uncommented if needed */}
          </div>

          {/* Filters + Search + Submit button on the right */}
          <div className="flex flex-col md:flex-row gap-2 items-center">
            {/* Date Range Filters */}
            {dateRangeFilter && (
              <div className="flex gap-2 items-center">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Date Range</label>
                  <Flatpickr
                    value={[
                      dateRangeFilter.startDate ? format(dateRangeFilter.startDate, 'yyyy-MM-dd') : '',
                      dateRangeFilter.endDate ? format(dateRangeFilter.endDate, 'yyyy-MM-dd') : ''
                    ]}
                    onChange={(dates) => {
                      if (dates && dates.length === 2) {
                        dateRangeFilter.onStartDateChange(dates[0]);
                        dateRangeFilter.onEndDateChange(dates[1]);
                      } else if (dates && dates.length === 1) {
                        dateRangeFilter.onStartDateChange(dates[0]);
                        dateRangeFilter.onEndDateChange(null);
                      } else {
                        dateRangeFilter.onStartDateChange(null);
                        dateRangeFilter.onEndDateChange(null);
                      }
                    }}
                    options={{
                      mode: "range",
                      dateFormat: "Y-m-d",
                      allowInput: true,
                      clickOpens: true,
                      showMonths: 2,
                      static: false,
                      // placeholder: "Select date range...",
                      disable: [
                        function(date) {
                          // Disable future dates if needed
                          return date > new Date();
                        }
                      ]
                    }}
                    className="border rounded px-3 py-2 min-w-[200px] cursor-pointer"
                    placeholder="Select date range..."
                  />
                </div>
                {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
                  <button
                    className="bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-300 whitespace-nowrap mt-6"
                    onClick={() => {
                      dateRangeFilter.onStartDateChange(null);
                      dateRangeFilter.onEndDateChange(null);
                    }}
                    type="button"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}

            {filterOptions.map((group, index) => {
              // Check if first option has empty value to use its label as placeholder
              const firstOption = group.options[0];
              const optionsToShow = firstOption && firstOption.value === ""
                ? group.options
                : [{ label: `All ${group.label}`, value: "" }, ...group.options];
              
              return (
                <select
                  key={`${group.label}-${index}`}
                  className="border rounded px-3 py-2 min-w-[150px]"
                  value={filters[group.label] || ""}
                  onChange={(e) => {
                    group.onChange?.(e.target.value);
                    handleFilterChange(group.label, e.target.value);
                  }}
                >
                  {optionsToShow.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              );
            })}

            {/* Global search input */}
            <input
              type="text"
              placeholder="Global Search..."
              className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {submitbutton && <div>{submitbutton}</div>}
          </div>
        </div>
      ) : null}

      {inputfiled && <div className="mt-4 w-full">{inputfiled}</div>}
    </div>
  );

  return (
    <div className={`p-4 rounded-lg w-full border bg-white ${classname ?? ""}`}>
      {title ? (
        <div className="mb-3 text-lg font-semibold">{title}</div>
      ) : null}
      <DataTable
        columns={reactColumns}
        data={filteredData}
        pagination
        highlightOnHover
        responsive
        striped
        persistTableHead
        subHeader
        subHeaderComponent={SubHeaderComponent}
        paginationPerPage={perPage}
        paginationDefaultPage={currentPage}
        onChangePage={(page) => setCurrentPage(page)}
        onChangeRowsPerPage={(newPerPage) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
        customStyles={{
          rows: {
            style: {
              minHeight: "48px",
            },
          },
          headCells: {
            style: {
              fontWeight: "600",
              fontSize: "14px",
              border: "1px solid #ddd",
            },
          },
          cells: {
            style: {
              border: "1px solid #ddd",
            },
          },
        }}
      />
    </div>
  );
}
