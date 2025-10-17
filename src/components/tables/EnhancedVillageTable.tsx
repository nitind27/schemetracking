"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Column } from "./tabletype";
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';


type Props = {
    data: basicdetailsofvillagetype[];
    columns: Column<basicdetailsofvillagetype>[];
    title?: string;
    searchKey?: string;
    onVillageClick?: (village: basicdetailsofvillagetype) => void;
};

export function EnhancedVillageTable({
    data,
    columns,
    // title = "",
    searchKey = "village_name",
}: Props) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Generate cascading filter options from data
    const filterOptions = useMemo(() => {
        // Get all taluka options
        const talukaOptions = Array.from(
            new Set(data.map(item => item.taluka_name).filter(Boolean))
        ).map(taluka => ({ label: taluka, value: taluka }));

        // Get grampanchayat options based on selected taluka
        let gpData = data;
        if (filters["Taluka"]) {
            gpData = data.filter(item => item.taluka_name === filters["Taluka"]);
        }
        const gpOptions = Array.from(
            new Set(gpData.map(item => item.gp_name).filter(Boolean))
        ).map(gp => ({ label: gp, value: gp }));

        // Get village options based on selected taluka and grampanchayat
        let villageData = data;
        if (filters["Taluka"]) {
            villageData = villageData.filter(item => item.taluka_name === filters["Taluka"]);
        }
        if (filters["Grampanchayat"]) {
            villageData = villageData.filter(item => item.gp_name === filters["Grampanchayat"]);
        }
        const villageOptions = Array.from(
            new Set(villageData.map(item => item.village_name).filter(Boolean))
        ).map(village => ({ label: village, value: village }));

        return [
            {
                label: "तालुका",
                options: talukaOptions,
                value: filters["Taluka"] || "",
                onChange: (value: string) => {
                    setFilters(({
                        "Taluka": value,
                        "Grampanchayat": "", // Reset grampanchayat when taluka changes
                        "Village": "" // Reset village when taluka changes
                    }));
                    setCurrentPage(1);
                }
            },
            {
                label: "ग्रामपंचायत",
                options: gpOptions,
                value: filters["Grampanchayat"] || "",
                onChange: (value: string) => {
                    setFilters(prev => ({
                        ...prev,
                        "Grampanchayat": value,
                        "Village": "" // Reset village when grampanchayat changes
                    }));
                    setCurrentPage(1);
                }
            },
            {
                label: "गाव",
                options: villageOptions,
                value: filters["Village"] || "",
                onChange: (value: string) => {
                    setFilters(prev => ({ ...prev, "Village": value }));
                    setCurrentPage(1);
                }
            }
        ];
    }, [data, filters]);

    const reactColumns = useMemo(() => {
        const baseColumns = [
            {
                name: "SR No.",
                cell: (_row: basicdetailsofvillagetype, index: number) =>
                    perPage * (currentPage - 1) + index + 1,
                width: "80px",
            },
        ];

        const dataColumns = columns.map((col) => ({
            name: col.label,
            selector: (row: basicdetailsofvillagetype) =>
                col.accessor ? String(row[col.accessor] ?? "") : "",
            cell: col.render
                ? (row: basicdetailsofvillagetype) => col.render?.(row)
                : (row: basicdetailsofvillagetype) => (col.accessor ? String(row[col.accessor]) : ""),
            sortable: true,
            width: col.width,
        }));

        return [...baseColumns, ...dataColumns];
    }, [columns, perPage, currentPage]);

    const filteredData = useMemo(() => {
        // Check if any filter or search is applied
        const hasActiveFilters = Object.values(filters).some(filter => filter) || search;

        // If no filters are applied, return empty array to show "not found" message
        if (!hasActiveFilters) {
            return [];
        }

        let tempData = [...data];

        // Apply dropdown filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                tempData = tempData.filter((row) => {
                    switch (key) {
                        case "Taluka":
                            return String(row.taluka_name) === String(value);
                        case "Grampanchayat":
                            return String(row.gp_name) === String(value);
                        case "Village":
                            return String(row.village_name) === String(value);
                        default:
                            return true;
                    }
                });
            }
        });

        // Apply search
        if (search && searchKey) {
            tempData = tempData.filter((row) => {
                const searchValue = String(row[searchKey as keyof basicdetailsofvillagetype] ?? "");
                return searchValue.toLowerCase().includes(search.toLowerCase());
            });
        } else if (search) {
            tempData = tempData.filter((row) =>
                Object.values(row).some((v) =>
                    String(v ?? "").toLowerCase().includes(search.toLowerCase())
                )
            );
        }

        return tempData;
    }, [data, filters, search, searchKey]);

    const handleFilterChange = (filterKey: string, value: string) => {
        setFilters((prev) => ({ ...prev, [filterKey]: value }));
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setFilters({});
        setSearch("");
        setCurrentPage(1);
    };

    const SubHeaderComponent = (
        <div className="space-y-4 w-full">

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    {filterOptions.map((group, index) => (
                        <div key={`${group.label}-${index}`} className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 text-left">
                                {group.label}
                            </label>
                            <select
                                className="border rounded px-3 py-2 min-w-[180px] bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={group.value || ""}
                                onChange={(e) => {
                                    group.onChange?.(e.target.value);
                                    handleFilterChange(group.label, e.target.value);
                                }}
                            >
                                <option value="">{group.label} निवडा</option>
                                {group.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 text-left">Search</label>
                        <input
                            type="text"
                            placeholder="Search villages..."
                            className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200 text-sm mt-5"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                    Showing {filteredData.length} of {data.length} villages
                </span>

            </div>
        </div>
    );

    return (
        <div className="p-4 rounded-lg w-full border bg-white shadow-sm">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">गावा विषयी प्राथमिक</h2>
                 
            </div>

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
                            backgroundColor: "#f8f9fa",
                        },
                    },
                    cells: {
                        style: {
                            border: "1px solid #ddd",
                        },
                    },
                    subHeader: {
                        style: {
                            backgroundColor: "#f8f9fa",
                            borderBottom: "1px solid #ddd",
                        },
                    },
                }}
                noDataComponent={
                    <div className="text-center py-8">
                        {Object.values(filters).some(filter => filter) || search ? (
                            <>
                                <p className="text-gray-500 text-lg">कोई गाव मिला नहीं</p>
                                <p className="text-gray-400 text-sm mt-2">आपके द्वारा चुने गए फिल्टर के अनुसार कोई डेटा नहीं मिला</p>
                                <button
                                    onClick={clearAllFilters}
                                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                                >
                                    फिल्टर साफ करें
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500 text-lg">कोणताही डेटा उपलब्ध नाही.</p>
                                <p className="text-gray-400 text-sm mt-2">कृपया फिल्टर वापरून डेटा शोधा.</p>
                            </>
                        )}
                    </div>
                }
            />
        </div>
    );
}
