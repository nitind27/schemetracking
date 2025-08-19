"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";

type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  label: string;
  options: FilterOption[];
  value?:string;
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
};

export function Tabviewtable<T extends object>({
  data,
  columns,
  filterOptions = [],
  searchKey,
  inputfiled,
  submitbutton,
  classname,
  tabFilter,
}: Props<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<string>(
    tabFilter?.defaultValue ?? (tabFilter?.tabs?.[0]?.value ?? "")
  );

  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "");

  const reactColumns = useMemo(() => {
    return [
      {
        name: "SR No.",
        cell: (_row: T, index: number) => (perPage * (currentPage - 1)) + index + 1,
        width: "80px",
      },
      ...columns.map((col) => ({
        name: col.label,
        selector: (row: T) =>
          col.accessor ? String(row[col.accessor] ?? "") : "",
        cell: col.render
          ? (row: T) => col.render?.(row)
          : (row: T) => (col.accessor ? String(row[col.accessor]) : ""),
        sortable: col.sortable !== false,
        width: col.width,
      })),
    ];
  }, [columns, perPage, currentPage]);

  const filteredData = useMemo(() => {
    let tempData = [...data];

    // Apply tab filter first (if configured and not "All")
    if (tabFilter && activeTab !== "") {
      const targets = [tabFilter.field, ...(tabFilter.fallbackFields ?? [])];
      const targetVal = tabFilter.normalize ? normalize(String(activeTab)) : String(activeTab);
      tempData = tempData.filter((row) => {
        return targets.some((key) => {
          const value = String((row as any)[key] ?? "");
          const comp = tabFilter.normalize ? normalize(value) : value;
          return comp === targetVal;
        });
      });
    }

    // Apply multiple dropdown filters
    if (filterOptions.length > 0) {
      tempData = tempData.filter((row) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          return String((row as any)[key]) === String(value);
        });
      });
    }

    // Column-specific search
    if (search && searchKey) {
      tempData = tempData.filter((row) =>
        String((row as any)[searchKey])
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }
    // Global search
    else if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row as any).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [data, filters, search, searchKey, filterOptions, tabFilter, activeTab]);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

const SubHeaderComponent = (
  <div className="space-y-4 w-full">
    {tabFilter?.tabs?.length ? (
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* Tabs on the left */}
        <div className="flex gap-2 flex-wrap">
          {tabFilter.tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                setActiveTab(t.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded border transition-colors ${
                activeTab === t.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters + Search + Submit button on the right */}
        <div className="flex flex-col md:flex-row gap-2 items-center">
          {filterOptions.map((group, index) => (
            <select
              key={`${group.label}-${index}`}
              className="border rounded px-3 py-2 min-w-[150px]"
              value={group.value || ""}
              onChange={(e) => {
                group.onChange?.(e.target.value);
                handleFilterChange(group.label, e.target.value);
              }}
            >
              <option value="">All {group.label}</option>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          <input
            type="text"
            placeholder="Search..."
            className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {submitbutton && <div>{submitbutton}</div>}
        </div>
      </div>
    ) : null}

    {inputfiled && (
      <div className="mt-4 w-full">{inputfiled}</div>
    )}
  </div>
);

  return (
   <div className="p-4  rounded-lg w-full border bg-white">
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
        onChangePage={page => setCurrentPage(page)}
        onChangeRowsPerPage={newPerPage => {
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