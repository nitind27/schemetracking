"use client";

import { useState, useMemo } from 'react';
import React from 'react';
import { basicdetailsofvillagetype, Futureworktype } from './Cfrtype/futurework';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import DataTable from "react-data-table-component";
import WorkTypePieCharts from "./WorkTypePieCharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Inline donut chart for work status
function FutureStatusChart({ series, labels, colors, total }: { series: number[]; labels: string[]; colors: string[]; total: number }) {
    const options: ApexOptions = {
        chart: { fontFamily: "Outfit, sans-serif", type: "donut", toolbar: { show: false } },
        colors, labels,
        legend: { show: true, position: "bottom", horizontalAlign: "center", fontFamily: "Outfit", fontSize: "12px" },
        dataLabels: {
            enabled: true,
            formatter: (val: string) => parseFloat(val).toFixed(1) + "%",
            style: { fontSize: "11px", fontWeight: "bold", colors: ["#fff"] },
        },
        tooltip: { y: { formatter: (v: number) => v + " works" } },
        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    labels: {
                        show: true,
                        total: {
                            show: true, showAlways: true, label: "Total Works",
                            fontSize: "12px", fontWeight: "bold", color: "#666",
                            formatter: () => total.toString(),
                        },
                    },
                },
            },
        },
    };
    return <ReactApexChart options={options} series={series} type="donut" height={220} />;
}

// Inline Modal
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/40 flex z-99999 items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-3 p-6 relative">
                <button className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-red-500 font-bold" onClick={onClose}>&times;</button>
                <h3 className="mb-4 text-lg font-bold text-center">{title}</h3>
                <div className="overflow-auto max-h-[70vh]">{children}</div>
            </div>
        </div>
    );
}

interface Props {
    serverData: Futureworktype[];
    basicVillageData: basicdetailsofvillagetype[];
}



const Futurecommer: React.FC<Props> = ({ serverData, basicVillageData }) => {
    const [data] = useState<Futureworktype[]>(serverData || []);
    const [data1] = useState<basicdetailsofvillagetype[]>(basicVillageData || []);
    const [selectedWork, setSelectedWork] = useState<Futureworktype | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<{ taluka_name: string; gp_name: string; village_name: string; works: Futureworktype[]; count: number } | null>(null);
    // Table state
    const [tableFilters, setTableFilters] = useState<Record<string, string>>({});
    const [tableSearch, setTableSearch] = useState("");
    const [tablePage, setTablePage] = useState(1);
    const [tablePerPage, setTablePerPage] = useState(10);

    // Group works by taluka + village + gp
    const groupedData = useMemo(() => {
        const groups = new Map<string, { key: string; taluka_name: string; gp_name: string; village_name: string; works: Futureworktype[]; count: number; work_status: string }>();
        data.forEach(work => {
            const key = `${work.taluka_name || ''}_${work.village_name || ''}_${work.gp_name || ''}`;
            if (groups.has(key)) {
                const g = groups.get(key)!;
                g.works.push(work);
                g.count = g.works.length;
            } else {
                groups.set(key, { key, taluka_name: work.taluka_name || '', gp_name: work.gp_name || '', village_name: work.village_name || '', works: [work], count: 1, work_status: work.work_status || '' });
            }
        });
        groups.forEach(g => {
            const statuses = [...new Set(g.works.map(w => w.work_status).filter(Boolean))];
            g.work_status = statuses.join(', ');
        });
        return Array.from(groups.values());
    }, [data]);

    // Helper function to ensure proper string encoding
    const safeString = (value: unknown): string => {
        if (value === null || value === undefined) return "N/A";
        return String(value);
    };

    // Date formatting function
    function formatDate(dateString: string | undefined | null): string {
        if (!dateString) return '-';
        const trimmed = dateString.trim();
        if (/^0+[-/]0+[-/]0+/.test(trimmed)) return '-';
        const date = new Date(trimmed);
        if (isNaN(date.getTime())) return '-';
        const year = date.getFullYear();
        if (year < 1900) return '-';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}-${month}-${year}`;
    }

    type ModalField = {
        key: keyof Futureworktype;
        label: string;
        render?: (row: Futureworktype) => React.ReactNode;
    };

    const modalFields: ModalField[] = [
        { key: 'taluka_name', label: 'Taluka' },
        { key: 'gp_name', label: 'Grampanchayat' },
        { key: 'village_name', label: 'Village' },
        { key: 'total_area', label: 'Total Area' },
        { key: 'estimated_amount', label: 'Estimated Amount' },
        { key: 'department_name', label: 'Department Name' },
        { key: 'implementing_method', label: 'Implementing Method' },
        { key: 'work_status', label: 'Work Status' },
        { key: 'username', label: 'User Name' },
        { key: 'user_id', label: 'Internal User ID' },
        { key: 'status', label: 'Status' },
      
    ];

    const renderWorkModal = () => (
        !selectedWork ? null : (
            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {modalFields.map(({ key, label, render }) => {
                        const value = render ? render(selectedWork) : selectedWork[key];
                        if (value === undefined || value === null || value === "") return null;
                        return (
                            <div key={String(key)}>
                                <span className="font-semibold">{label}:</span> <span>{String(value)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    );

    // Recent works sorted by created_at desc
    const recentWorks = useMemo(() => {
        return [...data]
            .sort((a, b) => {
                const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                return db - da;
            })
            .slice(0, 10);
    }, [data]);

    // Work status counts
    const completedCount = data.filter(i => i.work_status === "Completed").length;
    const inProgressCount = data.filter(i => i.work_status === "In Progress").length;
    const pendingCount = data.filter(i => i.work_status === "Pending").length;
    const total = data.length;
    const completedPct = total > 0 ? (completedCount / total) * 100 : 0;
    const inProgressPct = total > 0 ? (inProgressCount / total) * 100 : 0;
    const pendingPct = total > 0 ? (pendingCount / total) * 100 : 0;
    const statusSeries = [completedCount, inProgressCount, pendingCount];
    const statusLabels = ["Completed", "In Progress", "Pending"];
    const statusColors = ["#4CAF50", "#FF9800", "#F44336"];

    // Cascading filter options from grouped data
    const cascadingFilterOptions = useMemo(() => {
        const talukaOptions = Array.from(new Set(groupedData.map(i => i.taluka_name).filter(Boolean))).sort().map(v => ({ label: v!, value: v! }));
        let gpData = groupedData;
        if (tableFilters["Taluka"]) gpData = groupedData.filter(i => i.taluka_name === tableFilters["Taluka"]);
        const gpOptions = Array.from(new Set(gpData.map(i => i.gp_name).filter(Boolean))).sort().map(v => ({ label: v!, value: v! }));
        let villageData = groupedData;
        if (tableFilters["Taluka"]) villageData = villageData.filter(i => i.taluka_name === tableFilters["Taluka"]);
        if (tableFilters["Grampanchayat"]) villageData = villageData.filter(i => i.gp_name === tableFilters["Grampanchayat"]);
        const villageOptions = Array.from(new Set(villageData.map(i => i.village_name).filter(Boolean))).sort().map(v => ({ label: v!, value: v! }));
        return { talukaOptions, gpOptions, villageOptions };
    }, [groupedData, tableFilters]);

    const hasTableFilters = Object.values(tableFilters).some(f => f) || !!tableSearch;

    // Recent 10 grouped locations by most recent created_at
    const recentGroupedData = useMemo(() => {
        return [...groupedData]
            .sort((a, b) => {
                const da = Math.max(...a.works.map(w => w.created_at ? new Date(w.created_at).getTime() : 0));
                const db = Math.max(...b.works.map(w => w.created_at ? new Date(w.created_at).getTime() : 0));
                return db - da;
            })
            .slice(0, 10);
    }, [groupedData]);

    const filteredTableData = useMemo(() => {
        if (!hasTableFilters) return recentGroupedData;
        let d = [...groupedData];
        if (tableFilters["Taluka"]) d = d.filter(r => r.taluka_name === tableFilters["Taluka"]);
        if (tableFilters["Grampanchayat"]) d = d.filter(r => r.gp_name === tableFilters["Grampanchayat"]);
        if (tableFilters["Village"]) d = d.filter(r => r.village_name === tableFilters["Village"]);
        if (tableFilters["WorkStatus"]) d = d.filter(r => r.works.some(w => w.work_status === tableFilters["WorkStatus"]));
        if (tableSearch) d = d.filter(r =>
            (r.village_name || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
            (r.taluka_name || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
            (r.gp_name || "").toLowerCase().includes(tableSearch.toLowerCase())
        );
        return d;
    }, [groupedData, tableFilters, tableSearch, hasTableFilters, recentGroupedData]);

    const tableSubHeader = (
        <div className="flex flex-wrap gap-2 items-end w-full py-2">
            <select className="border rounded px-2 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                value={tableFilters["Taluka"] || ""}
                onChange={e => { setTableFilters({ "Taluka": e.target.value, "Grampanchayat": "", "Village": "", "WorkStatus": tableFilters["WorkStatus"] || "" }); setTablePage(1); }}>
                <option value="">तालुका निवडा</option>
                {cascadingFilterOptions.talukaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                value={tableFilters["Grampanchayat"] || ""}
                onChange={e => { setTableFilters(p => ({ ...p, "Grampanchayat": e.target.value, "Village": "" })); setTablePage(1); }}>
                <option value="">ग्रामपंचायत निवडा</option>
                {cascadingFilterOptions.gpOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                value={tableFilters["Village"] || ""}
                onChange={e => { setTableFilters(p => ({ ...p, "Village": e.target.value })); setTablePage(1); }}>
                <option value="">गाव निवडा</option>
                {cascadingFilterOptions.villageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                value={tableFilters["WorkStatus"] || ""}
                onChange={e => { setTableFilters(p => ({ ...p, "WorkStatus": e.target.value })); setTablePage(1); }}>
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
            </select>
            <input type="text" placeholder="Search..."
                className="border rounded px-2 py-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                value={tableSearch}
                onChange={e => { setTableSearch(e.target.value); setTablePage(1); }} />
            <button onClick={() => { setTableFilters({}); setTableSearch(""); setTablePage(1); }}
                className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm whitespace-nowrap">
                Clear All
            </button>
        </div>
    );

    type GroupedFutureType = { key: string; taluka_name: string; gp_name: string; village_name: string; works: Futureworktype[]; count: number; work_status: string };

    const tableColumns = useMemo(() => [
        {
            name: "SR No.",
            cell: (_row: GroupedFutureType, index: number) => tablePerPage * (tablePage - 1) + index + 1,
            width: "70px",
        },
        { name: "Taluka", selector: (r: GroupedFutureType) => r.taluka_name || '', cell: (r: GroupedFutureType) => <span className="font-medium">{r.taluka_name || 'N/A'}</span>, sortable: true },
        { name: "Grampanchayat", selector: (r: GroupedFutureType) => r.gp_name || '', cell: (r: GroupedFutureType) => <span className="font-medium">{r.gp_name || 'N/A'}</span>, sortable: true },
        { name: "Village", selector: (r: GroupedFutureType) => r.village_name || '', cell: (r: GroupedFutureType) => <span className="font-medium">{r.village_name || 'N/A'}</span>, sortable: true },
        {
            name: "Work Count",
            cell: (r: GroupedFutureType) => (
                <span
                    className="cursor-pointer underline text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                    onClick={() => setSelectedGroup({ taluka_name: r.taluka_name, gp_name: r.gp_name, village_name: r.village_name, works: r.works, count: r.count })}
                >
                    {r.count} {r.count === 1 ? 'Work' : 'Works'}
                </span>
            ),
            sortable: false,
        },
    ], [tablePerPage, tablePage]);

    // Export to Excel function with proper UTF-8 encoding for Marathi
    const exportToExcel = () => {
        const excelData = data.map((row, index) => {
            return {
                "Sr No": index + 1,
                "Taluka": safeString(row.taluka_name),
                "Grampanchayat": safeString(row.gp_name),
                "Village": safeString(row.village_name),
                "Work Name": safeString(row.work_name),
                "Total Area": safeString(row.total_area),
                "Estimated Amount": safeString(row.estimated_amount),
                "Department Name": safeString(row.department_name),
                "Implementing Method": safeString(row.implementing_method),
                "Work Status": safeString(row.work_status),
                "Username": safeString(row.username),
                "User ID": safeString(row.user_id),
                "Status": safeString(row.status),
                "Created At": formatDate(row.created_at),
                "Updated At": formatDate(row.updated_at),
            };
        });

        // Create worksheet with proper encoding
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            cellDates: false,
            dateNF: 'yyyy-mm-dd'
        });

        // Set column widths for better readability
        const columnWidths = [
            { wch: 8 },   // Sr No
            { wch: 25 },  // Taluka
            { wch: 25 },  // Grampanchayat
            { wch: 25 },  // Village
            { wch: 35 },  // Work Name
            { wch: 15 },  // Total Area
            { wch: 18 },  // Estimated Amount
            { wch: 25 },  // Department Name
            { wch: 25 },  // Implementing Method
            { wch: 18 },  // Work Status
            { wch: 20 },  // Username
            { wch: 15 },  // User ID
            { wch: 12 },  // Status
            { wch: 20 },  // Created At
            { wch: 20 },  // Updated At
        ];
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Future Work");

        // Generate filename
        const fileName = `Future_Work_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Write file - XLSX format natively supports UTF-8
        XLSX.writeFile(workbook, fileName);
    };

    // Export to PDF function with proper Unicode support for Marathi using HTML table with pagination
    const exportToPDF = async () => {
        try {
            // Dynamically import html2canvas
            const html2canvas = (await import('html2canvas')).default;
            
            // Create PDF in landscape mode
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = 297; // A4 landscape width in mm
            const pageHeight = 210; // A4 landscape height in mm
            const maxRowsPerPage = 25; // Approximate rows per page
            
            // Split data into chunks for pagination
            const totalPages = Math.ceil(data.length / maxRowsPerPage);
            
            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                const startIndex = pageIndex * maxRowsPerPage;
                const endIndex = Math.min(startIndex + maxRowsPerPage, data.length);
                const pageData = data.slice(startIndex, endIndex);
                
                // Create a temporary container for the table
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '0';
                tempDiv.style.width = '1200px';
                tempDiv.style.backgroundColor = 'white';
                tempDiv.style.padding = '20px';
                tempDiv.style.fontFamily = 'Arial, sans-serif';
                
                // Create table HTML with proper Marathi text support
                const tableHTML = `
                    <div style="font-family: Arial, sans-serif; width: 100%;">
                        <h2 style="text-align: center; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Future Work Report</h2>
                        <div style="margin-bottom: 10px; font-size: 12px; text-align: center;">
                            Page ${pageIndex + 1} of ${totalPages} | Total Records: ${data.length}
                        </div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                            <thead>
                                <tr style="background-color: #2980b9; color: white;">
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Sr No</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Taluka</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Grampanchayat</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Village</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Work Name</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Work Status</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Total Area</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Estimated Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pageData.map((row, idx) => {
                                    const globalIndex = startIndex + idx;
                                    return `
                                        <tr style="background-color: ${globalIndex % 2 === 0 ? '#f9f9f9' : 'white'};">
                                            <td style="border: 1px solid #ddd; padding: 5px;">${globalIndex + 1}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.taluka_name)}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.gp_name)}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.village_name)}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.work_name)}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.work_status)}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.total_area)}</td>
                                            <td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.estimated_amount)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                tempDiv.innerHTML = tableHTML;
                document.body.appendChild(tempDiv);
                
                try {
                    // Convert HTML to canvas with proper rendering
                    const canvas = await html2canvas(tempDiv, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        backgroundColor: '#ffffff',
                        logging: false,
                    });
                    
                    // Remove temporary div
                    document.body.removeChild(tempDiv);
                    
                    // Calculate image dimensions to fit page
                    const imgWidth = pageWidth;
                    const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pageHeight);
                    
                    // Add new page if not first page
                    if (pageIndex > 0) {
                        doc.addPage();
                    }
                    
                    // Add image to PDF
                    const imgData = canvas.toDataURL('image/png');
                    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    
                } catch (error) {
                    // Remove temporary div in case of error
                    if (document.body.contains(tempDiv)) {
                        document.body.removeChild(tempDiv);
                    }
                    console.error('Error generating PDF page:', error);
                    throw error;
                }
            }
            
            // Save PDF
            const fileName = `Future_Work_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('PDF generation failed. Please try again.');
        }
    };

    // Export to CSV with UTF-8 BOM for proper Marathi text support
    const exportToCSV = () => {
        // CSV headers
        const headers = [
            "Sr No", "Taluka", "Grampanchayat", "Village", "Work Name", 
            "Total Area", "Estimated Amount", "Department Name", 
            "Implementing Method", "Work Status", "Username", 
            "User ID", "Status", "Created At", "Updated At"
        ];

        // Convert data to CSV rows
        const csvRows = data.map((row, index) => [
            index + 1,
            safeString(row.taluka_name),
            safeString(row.gp_name),
            safeString(row.village_name),
            safeString(row.work_name),
            safeString(row.total_area),
            safeString(row.estimated_amount),
            safeString(row.department_name),
            safeString(row.implementing_method),
            safeString(row.work_status),
            safeString(row.username),
            safeString(row.user_id),
            safeString(row.status),
            formatDate(row.created_at),
            formatDate(row.updated_at),
        ]);

        // Escape CSV values (handle commas and quotes)
        const escapeCSV = (value: unknown): string => {
            const str = safeString(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Build CSV content
        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...csvRows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        // Add UTF-8 BOM for proper encoding in Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Future_Work_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">

            {/* 3 Cards - same layout as Presetntwork */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Card 1: Recent Works marquee */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm h-[400px] flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Recent Works</h3>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Last {recentWorks.length}</span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {recentWorks.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No recent works</div>
                        ) : (
                            <div className="h-full overflow-hidden">
                                <style>{`
                                    @keyframes futureScrollUp {
                                        0% { transform: translateY(0); }
                                        100% { transform: translateY(-50%); }
                                    }
                                    .future-scroll-marquee { animation: futureScrollUp 18s linear infinite; }
                                    .future-scroll-marquee:hover { animation-play-state: paused; }
                                `}</style>
                                <div className="future-scroll-marquee">
                                    {[...recentWorks, ...recentWorks].map((work, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer mb-2"
                                            onClick={() => setSelectedWork(work)}
                                        >
                                            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                                work.work_status === "Completed" ? "bg-green-500" :
                                                work.work_status === "In Progress" ? "bg-yellow-500" : "bg-red-400"
                                            }`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-gray-800 truncate">{work.work_name || "N/A"}</p>
                                                <p className="text-xs text-gray-500 truncate">{work.village_name} · {work.taluka_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700">
                                                        {work.work_status || "N/A"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(work.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 2: Work Status donut */}
                <div className="bg-[#f3fff3] rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[400px] flex flex-col">
                    <div className="mb-4 flex-shrink-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Work Status</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Completed: <span className="font-semibold text-gray-900">{completedPct.toFixed(1)}%</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-gray-600">In Progress: <span className="font-semibold text-gray-900">{inProgressPct.toFixed(1)}%</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">Pending: <span className="font-semibold text-gray-900">{pendingPct.toFixed(1)}%</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <FutureStatusChart series={statusSeries} labels={statusLabels} colors={statusColors} total={data.length} />
                    </div>
                </div>

                {/* Card 3: NRM Work + Plantation Work tabbed - same as present works */}
                <WorkTypePieCharts
                    serverData={data as unknown as import('./Cfrtype/futurework').presentworktype[]}
                    basicVillageData={data1}
                />
            </div>

            {/* Export buttons */}
            <div className="mb-4 flex justify-end gap-3 flex-wrap">
                <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md">Export to Excel</button>
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">Export to CSV</button>
                <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md">Export to PDF</button>
            </div>

            <div className="p-4 rounded-lg w-full border bg-white shadow-sm">
                <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">CFR क्षेत्रातील प्रस्तावित कामांची माहिती</h2>
                    {!hasTableFilters && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Showing last 10 recent works</span>
                    )}
                </div>
                <DataTable
                    columns={tableColumns}
                    data={filteredTableData}
                    pagination
                    highlightOnHover
                    responsive
                    striped
                    persistTableHead
                    subHeader
                    subHeaderComponent={tableSubHeader}
                    paginationPerPage={tablePerPage}
                    paginationDefaultPage={tablePage}
                    onChangePage={p => setTablePage(p)}
                    onChangeRowsPerPage={(n) => { setTablePerPage(n); setTablePage(1); }}
                    customStyles={{
                        rows: { style: { minHeight: "48px" } },
                        headCells: { style: { fontWeight: "600", fontSize: "14px", border: "1px solid #ddd", backgroundColor: "#f8f9fa" } },
                        cells: { style: { border: "1px solid #ddd" } },
                        subHeader: { style: { backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" } },
                    }}
                    noDataComponent={
                        <div className="text-center py-8">
                            <p className="text-gray-500">कोणताही डेटा सापडला नाही</p>
                            {hasTableFilters && (
                                <button onClick={() => { setTableFilters({}); setTableSearch(""); }} className="mt-3 px-4 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                    फिल्टर साफ करा
                                </button>
                            )}
                        </div>
                    }
                />
            </div>

            {/* Grouped Works Modal */}
            <Modal
                open={!!selectedGroup}
                onClose={() => setSelectedGroup(null)}
                title={`Works in ${selectedGroup?.village_name || ''} (${selectedGroup?.count || 0} Works)`}
            >
                {selectedGroup && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div><span className="font-semibold">Taluka:</span> {selectedGroup.taluka_name || 'N/A'}</div>
                                <div><span className="font-semibold">Grampanchayat:</span> {selectedGroup.gp_name || 'N/A'}</div>
                                <div><span className="font-semibold">Village:</span> {selectedGroup.village_name || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-blue-600 text-white">
                                        <th className="border border-gray-300 px-4 py-2 text-left">Sr No</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Work Name</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Total Area</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Est. Amount</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedGroup.works.map((work, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                                            <td className="border border-gray-300 px-4 py-2 font-medium">{work.work_name || 'N/A'}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${work.work_status === 'Completed' ? 'bg-green-100 text-green-800' : work.work_status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                    {work.work_status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">{work.total_area || 'N/A'}</td>
                                            <td className="border border-gray-300 px-4 py-2">{work.estimated_amount || 'N/A'}</td>
                                            <td className="border border-gray-300 px-4 py-2 whitespace-nowrap">{formatDate(work.created_at)}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                                                    onClick={() => { setSelectedGroup(null); setSelectedWork(work); }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={!!selectedWork} onClose={() => setSelectedWork(null)} title={`Work Name: ${selectedWork?.work_name ?? ''}`}>
                {renderWorkModal()}
            </Modal>
        </div>
    );
};

export default Futurecommer;
    