"use client"
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

import Ifrsmaplocations from '../farmersdata/Ifrsmaplocations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';

// Type definitions (adjust if your types are different)
interface Taluka {
    taluka_id: string | number;
    name: string;
}
interface Village {
    village_id: string | number;
    name: string;
    marathi_name?: string; // <-- Added
    taluka_id: string | number;
}
interface Farmer {
    farmer_id: number;
    name: string;
    adivasi: string;
    village_id: string | number;
    taluka_id: string | number;
    gat_no: string;
    vanksetra: string;
    aadhaar_no: string;
    contact_no: string;
    email: string;
    kisan_id: string;
    documents: string;
    schemes: string;
    genger: string;
    dob: string;
    profile_photo: string;
    status: string;
    schedule_j: string;
    gis: string;
    update_record: string;
    geo_photo: string;
    farmer_record: string;
}
type TalukaCount = {
    total: number;
    filledCount: number;
    names: (string | null)[];
    color: 'red' | 'orange' | 'green';
    saturation: number;
};
type TalukaCounts = Record<string, TalukaCount>;

interface TalukawiseserveProps {
    talukaCounts: TalukaCounts;
    datataluka: Taluka[];
    datavillage: Village[];
    farmers: Farmer[];
}

const colorClass: Record<'red' | 'orange' | 'green', string> = {
    red: 'bg-[#FF0000]',
    orange: 'bg-[#FFA500]',
    green: 'bg-[#008000]',
};
const colorClassbtn: Record<'red' | 'orange' | 'green', string> = {
    red: 'bg-gradient-to-r from-[#ff8282] to-[#FF0000] border border-[#FF0000] text-white',
    orange: 'bg-gradient-to-r from-[#fccc74] to-[#FFA500] border border-[#FFA500] text-white',
    green: 'bg-gradient-to-r from-[#3fba3f] to-[#008000] border border-[#008000] text-white',
};
const Talukawiseserve: React.FC<TalukawiseserveProps> = ({
    talukaCounts,
    datataluka,
    datavillage,
    farmers,
}) => {
    const [openTaluka, setOpenTaluka] = useState<string | null>(null);
    const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
    const [activeTab, setActiveTab] = useState<'surveyed' | 'yet-to-be-surveyed'>('surveyed');
    const [currentPage, setCurrentPage] = useState(1);
    const [villageSearch, setVillageSearch] = useState(""); // <-- NEW: search state
    const [farmerSearch, setFarmerSearch] = useState(""); // <-- NEW: search state for farmers
    const [showFarmerModal, setShowFarmerModal] = useState(false); // NEW
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null); // NEW
    const [photoOpenIndexes, setPhotoOpenIndexes] = useState<Record<string, boolean>>({}); // <-- NEW
    const [fullImage, setFullImage] = useState<string | null>(null); // <-- NEW
    const itemsPerPage = 10;

    // Find taluka_id by name
    const getTalukaIdByName = (name: string) => {
        const taluka = datataluka.find((t) => t.name === name);
        return taluka ? taluka.taluka_id : null;
    };

    // Get villages for a taluka_id
    const getVillagesForTaluka = (taluka_id: string | number) => {
        return datavillage.filter((v) => String(v.taluka_id) === String(taluka_id));
    };

    // Get farmers for a specific village
    const getFarmersForVillage = (village_id: string | number) => {
        return farmers.filter((f) => String(f.village_id) === String(village_id));
    };

    // Filter farmers based on survey status
    const getSurveyedFarmers = (village_id: string | number) => {
        return getFarmersForVillage(village_id).filter(
            (f) => f.update_record && f.update_record.trim() !== ''
        );
    };

    const getYetToBeSurveyedFarmers = (village_id: string | number) => {
        return getFarmersForVillage(village_id).filter(
            (f) => !f.update_record || f.update_record.trim() === ''
        );
    };

    // Get village name by ID
    const getVillageName = (village_id: string | number) => {
        const village = datavillage.find((v) => String(v.village_id) === String(village_id));
        return village ? village.name : '';
    };

    // Get taluka name by ID
    const getTalukaName = (taluka_id: string | number) => {
        const taluka = datataluka.find((t) => String(t.taluka_id) === String(taluka_id));
        return taluka ? taluka.name : '';
    };

    // Export to Excel function for farmer data
    const exportToExcel = (data: Farmer[], villageName: string, talukaName: string, tabType: string) => {
        const worksheet = XLSX.utils.json_to_sheet(
            data.map((farmer, index) => ({
                'Sr No': index + 1,
                'IFR Name': farmer.farmer_record?.split('|')[0] || "",
                'Contact Number': farmer.farmer_record?.split('|')[6] || "",
                'Aadhaar Card Number': farmer.farmer_record?.split('|')[5] || "",
                'Village': getVillageName(farmer.village_id),
                'Taluka': getTalukaName(farmer.taluka_id),
                'Gat No': farmer.farmer_record?.split('|')[2] || "",
                'Vanksetra': farmer.farmer_record?.split('|')[3] || "",
                'Adivasi': farmer.farmer_record?.split('|')[1] || "",
                'Kisan ID': farmer.farmer_record?.split('|')[8] || "",
                'Gender': farmer.farmer_record?.split('|')[10] || "",
                'DOB': farmer.farmer_record?.split('|')[9] || "",
                'Status': farmer.status,

            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `${villageName}_${tabType}`);

        // Generate filename
        const fileName = `${talukaName}_${villageName}_${tabType}_${new Date().toISOString().split('T')[0]}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    // Export to Excel function for village progress data
    const exportVillageProgressToExcel = (talukaName: string) => {
        const taluka_id = getTalukaIdByName(talukaName);
        if (!taluka_id) return;

        const villages = getVillagesForTaluka(taluka_id);
        const villageData = villages.map((village) => {
            const { total, filledCount, percent } = getVillageProgress(village.village_id);
            return {
                'Sr No': villages.indexOf(village) + 1,
                'Taluka Name': talukaName,
                'Village Name': village.name,
                'Total IFR Holders': total,
                'Surveyed Count': filledCount,
                'Yet to be Surveyed': total - filledCount,
                'Percentage': `${percent}%`,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(villageData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `${talukaName}_VillageProgress`);

        // Generate filename
        const fileName = `${talukaName}_Village_Wise_Serve_${new Date().toISOString().split('T')[0]}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    // Compute village progress
    const getVillageProgress = (village_id: string | number) => {
        const villageFarmers = farmers.filter(
            (f) => String(f.village_id) === String(village_id)
        );
        const total = villageFarmers.length;
        const filledCount = villageFarmers.filter(
            (f) => f.update_record && f.update_record.trim() !== ''
        ).length;
        const percent = total > 0 ? Math.round((filledCount / total) * 100) : 0;
        let color: 'red' | 'orange' | 'green' = 'red';
        if (percent >= 80) color = 'green';
        else if (percent >= 50) color = 'orange';
        return { total, filledCount, percent, color };
    };

    // Handle village click
    const handleVillageClick = (village: Village) => {
        setSelectedVillage(village);
        setActiveTab('surveyed'); // Reset to surveyed tab
    };

    // Handle back to villages
    const handleBackToVillages = () => {
        setSelectedVillage(null);
        setCurrentPage(1); // Reset to first page
    };

    // Handle tab change
    const handleTabChange = (tab: 'surveyed' | 'yet-to-be-surveyed') => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to first page when changing tabs
    };

    // Calculate pagination
    const getPaginatedData = (data: Farmer[]) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (data: Farmer[]) => {
        return Math.ceil(data.length / itemsPerPage);
    };

    // --- NEW: Helper to sort by color and percent ---
    const sortByColorAndPercent = <T extends { percent: number; color: 'green' | 'orange' | 'red' }>(arr: T[]) => {
        const colorOrder = { green: 0, orange: 1, red: 2 };
        return arr.sort((a, b) => {
            if (colorOrder[a.color] !== colorOrder[b.color]) {
                return colorOrder[a.color] - colorOrder[b.color];
            }
            // For same color, sort by percent descending
            return b.percent - a.percent;
        });
    };

    // --- NEW: Sorted Taluka List ---
    const sortedTalukaEntries = React.useMemo(() => {
        // Map to array with percent and color
        const arr = Object.entries(talukaCounts).map(([talukaName, info]) => {
            const percent = info.total > 0 ? Math.round((info.filledCount / info.total) * 100) : 0;
            return {
                talukaName,
                info,
                percent,
                color: info.color,
            };
        });
        return sortByColorAndPercent(arr);
    }, [talukaCounts]);

    // Helper to get all farmer details in a readable format
    const getFarmerDetails = (farmer: Farmer) => {
        const record = farmer.farmer_record?.split('|') || [];
        return [
            { label: "IFR Name", value: record[0] || "" },
            { label: "Adivasi", value: record[1] || "" },
            { label: "Gat No", value: record[2] || "" },
            { label: "Vanksetra", value: record[3] || "" },
            { label: "Nivas Seti", value: record[4] || "" },
            { label: "Aadhaar Card Number", value: record[5] || "" },
            { label: "Contact Number", value: record[6] || "" },
            { label: "Email", value: record[7] || "" },
            { label: "Kisan ID", value: record[8] || "" },
            { label: "DOB", value: record[9] || "" },
            { label: "Gender", value: record[10] || "" },
            { label: "Profile Photo", value: record[11] || "" },
            { label: "Aadhaar Photo", value: record[12] || "" },
            { label: "Compartment Number", value: record[13] || "" },
            { label: "Schedule J", value: record[14] || "" },
            { label: "Claim ID", value: record[15] || "" },
            { label: "Created At", value: record[16] || "" },
            { label: "Updated At", value: record[17] || "" },
            { label: "Village", value: getVillageName(farmer.village_id) },
            { label: "Taluka", value: getTalukaName(farmer.taluka_id) },
            { label: "Status", value: farmer.status },
            { label: "Photo", img: farmer.geo_photo },
            { label: "GIS", gis: farmer.gis },
            // Add more fields as needed
        ];
    };

    // Helper to download farmer details as PDF
    const downloadFarmerDetailsPDF = (farmer: Farmer) => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const details = getFarmerDetails(farmer);

        doc.setFontSize(16);
        doc.text('IFR Holder Details', 14, 18);

        const tableData = details
            .filter(item => !item.img && !item.gis)
            .map(item => [item.label, item.value || ""]);

        autoTable(doc, {
            startY: 24,
            head: [['Field', 'Value']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 },
        });

        // Use lastAutoTable from doc (cast to any to avoid TS error)
        let y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 34;
        if (details.some(item => item.img)) {
            doc.setFontSize(10);
            doc.text('Note: Images are not included in this PDF. Please view them in the application.', 14, y);
            y += 6;
        }
        if (details.some(item => item.gis)) {
            doc.setFontSize(10);
            doc.text('Note: GIS data is not included in this PDF.', 14, y);
        }

        const name = details.find(item => item.label === "IFR Name")?.value || "IFR_Holder";
        doc.save(`${name}_Details.pdf`);
    };

    return (
        <div className="p-5">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-6">
                Taluka Wise Survey
            </h2>
            <div className="space-y-6">
                {/* --- CHANGED: Use sortedTalukaEntries --- */}
                {sortedTalukaEntries.map(({ talukaName, info, percent }) => (
                    <div key={talukaName} className=''>
                        <div
                            className="mb-4 p-2 bg-gray-100 rounded-lg shadow hover:bg-gray-200"
                        >
                            {/* Top Row: Taluka Name (left) and Data + Button (right) */}
                            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5'>
                                <div className='w-full'>

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                                        {/* Left: Taluka Name */}
                                        <span
                                            className="font-semibold text-gray-700 cursor-pointer "

                                        >
                                            {talukaName}
                                        </span>

                                        {/* Right: Data and Button */}
                                        <span className="text-sm font-medium text-gray-600 flex gap-2">
                                            <div>

                                                {info.filledCount}/{info.total}
                                            </div>
                                            <div>

                                                (<span className='font-bold text-black'>{percent}%</span>)
                                            </div>
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-[100%] bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`${colorClass[info.color]} h-2 rounded-full transition-all duration-300`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">

                                    <button
                                        type="button"
                                        className={`min-w-[120px] ${colorClassbtn[info.color]} hover:opacity-90 focus:ring-2 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2`}
                                        onClick={() => {
                                            setOpenTaluka(talukaName);
                                            setVillageSearch(""); // <-- Reset search when opening a new taluka
                                        }}
                                    >
                                        Villages
                                    </button>


                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>


            {/* Modal */}
            {openTaluka && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 z-9999 flex items-center justify-center ">
                    <div className={`bg-white rounded-lg shadow-lg p-6 overflow-y-auto mt-5 ${!selectedVillage
                        ? 'w-full max-w-2xl max-h-[70vh]'
                        : 'w-full max-w-6xl max-h-[90vh]'
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {openTaluka} - Village Wise Survey
                            </h3>
                            <div className="flex items-center gap-4">
                                {!selectedVillage && (
                                    <button
                                        onClick={() => exportVillageProgressToExcel(openTaluka)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Excel
                                    </button>
                                )}
                                <button
                                    className="text-gray-500 hover:text-gray-800 text-2xl"
                                    onClick={() => {
                                        setOpenTaluka(null);
                                        setSelectedVillage(null);
                                        setVillageSearch(""); // <-- Reset search when closing modal
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {!selectedVillage ? (
                            // --- CHANGED: Add search box and sorted, filtered villages ---
                            <div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search villages..."
                                        value={villageSearch}
                                        onChange={e => setVillageSearch(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-4">
                                    {(() => {
                                        const taluka_id = getTalukaIdByName(openTaluka);
                                        if (!taluka_id) return <div>No villages found.</div>;
                                        let villages = getVillagesForTaluka(taluka_id);
                                        // Filter by search
                                        if (villageSearch.trim()) {
                                            villages = villages.filter(v =>
                                                v.name.toLowerCase().includes(villageSearch.trim().toLowerCase())
                                            );
                                        }
                                        // Map to progress info
                                        let villageProgressArr = villages.map((village) => {
                                            const { total, filledCount, percent, color } = getVillageProgress(village.village_id);
                                            return {
                                                ...village,
                                                total,
                                                filledCount,
                                                percent,
                                                color,
                                            };
                                        });
                                        // Sort by color and percent
                                        villageProgressArr = sortByColorAndPercent(villageProgressArr);

                                        if (villageProgressArr.length === 0)
                                            return <div>No villages found.</div>;
                                        return villageProgressArr.map((village) => (
                                            <div
                                                key={village.village_id}
                                                className="mb-4 p-4 bg-gray-50 rounded-lg shadow hover:bg-gray-100 cursor-pointer transition-colors"
                                                onClick={() => handleVillageClick(village)}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-gray-700">
                                                        {village.marathi_name}
                                                        {village.name ? ` (${village.name})` : ""}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {village.filledCount}/{village.total} ({village.percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4">
                                                    <div
                                                        className={`${colorClass[village.color]} h-4 rounded-full transition-all duration-300`}
                                                        style={{ width: `${village.percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        ) : (
                            // Show farmer data for selected village
                            <div>
                                {/* Back button */}
                                <div className="mb-4">
                                    <button
                                        onClick={handleBackToVillages}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back to Villages
                                    </button>
                                </div>

                                {/* Village header */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-gray-800">
                                        {selectedVillage.name} - IFR Holders Data
                                    </h4>
                                </div>

                                {/* --- NEW: Farmer search box --- */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search by name, Aadhaar, or contact..."
                                        value={farmerSearch}
                                        onChange={e => setFarmerSearch(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Tab Buttons */}
                                <div className="flex space-x-4 mb-6">
                                    <button
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'surveyed'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        onClick={() => handleTabChange('surveyed')}
                                    >
                                        Surveyed Beneficiaries
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'yet-to-be-surveyed'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        onClick={() => handleTabChange('yet-to-be-surveyed')}
                                    >
                                        Yet-to-be-surveyed IFR Holders
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="space-y-4">
                                    {(() => {
                                        const surveyedFarmers = getSurveyedFarmers(selectedVillage.village_id);
                                        const yetToBeSurveyedFarmers = getYetToBeSurveyedFarmers(selectedVillage.village_id);

                                        const currentData = activeTab === 'surveyed' ? surveyedFarmers : yetToBeSurveyedFarmers;
                                        // --- NEW: Filter currentData by farmerSearch ---
                                        const filteredData = farmerSearch.trim()
                                            ? currentData.filter(farmer => {
                                                const name = farmer.farmer_record?.split('|')[0] || "";
                                                const contact = farmer.farmer_record?.split('|')[6] || "";
                                                const aadhaar = farmer.farmer_record?.split('|')[5] || "";
                                                return (
                                                    name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
                                                    contact.includes(farmerSearch) ||
                                                    aadhaar.includes(farmerSearch)
                                                );
                                            })
                                            : currentData;

                                        const tabType = activeTab === 'surveyed' ? 'Surveyed' : 'YetToBeSurveyed';
                                        const paginatedData = getPaginatedData(filteredData);
                                        const totalPages = getTotalPages(filteredData);

                                        return (
                                            <>
                                                {/* Download Button */}
                                                <div className="flex justify-end mb-4">
                                                    <button
                                                        onClick={() => exportToExcel(filteredData, selectedVillage.name, openTaluka, tabType)}
                                                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Download Excel
                                                    </button>
                                                </div>

                                                {/* Data Count */}
                                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                                    <p className="text-lg font-semibold text-gray-700">
                                                        Total {activeTab === 'surveyed' ? 'Surveyed' : 'Yet-to-be-surveyed'} IFR Holders: {filteredData.length}
                                                    </p>
                                                </div>
                                                {/* Data Table */}
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full bg-white border border-gray-300">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                                                                    Sr No
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                                                                    IFR Name
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                                                                    Contact Number
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                                                                    Aadhaar Card Number
                                                                </th>



                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {paginatedData.map((farmer, index) => (
                                                                <tr key={farmer.farmer_id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-300">
                                                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                                                    </td>
                                                                    <td
                                                                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-700 border border-gray-300 cursor-pointer hover:underline"
                                                                        onClick={() => {
                                                                            setSelectedFarmer(farmer);
                                                                            setShowFarmerModal(true);
                                                                        }}
                                                                    >
                                                                        {farmer.farmer_record?.split('|')[0] || ""}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-300">
                                                                        {farmer.farmer_record?.split('|')[6] || ""}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-300">
                                                                        {farmer.farmer_record?.split('|')[5] || ""}
                                                                    </td>

                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination */}
                                                {totalPages > 1 && (
                                                    <div className="flex justify-center items-center space-x-4 mt-6">
                                                        <button
                                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                            disabled={currentPage === 1}
                                                            className={`px-4 py-2 rounded-lg font-medium ${currentPage === 1
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                }`}
                                                        >
                                                            Previous
                                                        </button>

                                                        <span className="px-4 py-2 text-gray-700 font-medium">
                                                            Page {currentPage} of {totalPages}
                                                        </span>

                                                        <button
                                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className={`px-4 py-2 rounded-lg font-medium ${currentPage === totalPages
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                }`}
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                )}

                                                {filteredData.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        No {activeTab === 'surveyed' ? 'surveyed' : 'yet-to-be-surveyed'} IFR holders found for this village.
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* --- Farmer Details Modal --- */}
            {showFarmerModal && selectedFarmer && (
                <div className="fixed inset-0 bg-[#0303033f] z-[10000] flex items-center justify-center bg-opacity-40 ">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative animate-fade-in h-[550px] overflow-scroll">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
                            onClick={() => setShowFarmerModal(false)}
                        >
                            &times;
                        </button>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-center text-blue-700 flex-1">IFR Holder Details</h2>
                            {/* --- PDF Download Button --- */}
                            <button
                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm mr-2"
                                onClick={() => downloadFarmerDetailsPDF(selectedFarmer)}
                            >
                                Download PDF
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {getFarmerDetails(selectedFarmer).map((item, idx) => (
  <div key={item.label + idx} className="flex flex-col border rounded p-2 bg-gray-50">
    <span className="text-xs text-gray-500">{item.label}</span>
    <span className="font-semibold text-gray-800">{item.value}</span>

    {/* Image display logic */}
    {item.img && (
      <>
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs w-fit"
          onClick={() =>
            setPhotoOpenIndexes(prev => ({
              ...prev,
              [idx]: !prev[idx]
            }))
          }
        >
          {photoOpenIndexes[idx] ? "Hide Photo" : "Show Photo"}
        </button>
        {photoOpenIndexes[idx] && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {item.img.split('|').map((imgPath, imgIdx) => (
              <Image
                key={imgIdx}
                src={`http://localhost:3000/api/uploadsgeophoto/${imgPath}`}
                alt={`Image ${imgIdx + 1}`}
                width={200} // or your preferred width
                height={100} // or your preferred height
                className="my-1 max-h-24 rounded border cursor-pointer object-cover w-full"
                onClick={() => setFullImage(`http://localhost:3000/api/uploadsgeophoto/${imgPath}`)}
              />
            ))}
          </div>
        )}
      </>
    )}

    {/* GIS display logic */}
    {item.gis && (() => {
      const coordinates = item.gis
        .split('|')
        .map(entry => {
          const parts = entry.split('}');
          if (parts.length >= 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }
          return null;
        })
        .filter(coord => coord !== null);

      return coordinates.length > 0 ? (
        <div className="mt-2">
          <Ifrsmaplocations coordinates={coordinates} />
        </div>
      ) : null;
    })()}
  </div>
))}


                        </div>
                        {fullImage && (
                            <div
                                className="fixed inset-0 z-[11000] bg-black bg-opacity-80 flex items-center justify-center"
                                onClick={() => setFullImage(null)}
                            >
                                <Image
                                    src={fullImage}
                                    alt="Full"
                                    className="max-w-full max-h-full rounded shadow-lg"
                                    style={{ objectFit: 'contain' }}
                                />
                                <button
                                    className="absolute top-5 right-5 text-white text-3xl font-bold"
                                    onClick={() => setFullImage(null)}
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Talukawiseserve;

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}
