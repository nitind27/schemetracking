"use client"
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// Type definitions (adjust if your types are different)
interface Taluka {
    taluka_id: string | number;
    name: string;
}
interface Village {
    village_id: string | number;
    name: string;
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
                'DOB':farmer.farmer_record?.split('|')[9] || "",
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

    return (
        <div className="p-5">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-6">
                Taluka Wise Survey 
            </h2>
            <div className="space-y-6">
                {Object.entries(talukaCounts).map(([talukaName, info]) => {
                    const percent =
                        info.total > 0
                            ? Math.round((info.filledCount / info.total) * 100)
                            : 0;
                    return (
                        <>
                            <div className=''>
                                <div
                                    key={talukaName}
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
                                                onClick={() => setOpenTaluka(talukaName)}
                                            >
                                                Villages
                                            </button>


                                        </div>
                                    </div>
                                </div>

                            </div>
                        </>

                    );
                })}
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
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {!selectedVillage ? (
                            // Show village progress bars
                            <div className="space-y-4">
                                {(() => {
                                    const taluka_id = getTalukaIdByName(openTaluka);
                                    if (!taluka_id) return <div>No villages found.</div>;
                                    const villages = getVillagesForTaluka(taluka_id);
                                    if (villages.length === 0)
                                        return <div>No villages found.</div>;
                                    return villages.map((village) => {
                                        const {
                                            total,
                                            filledCount,
                                            percent,
                                            color,
                                        } = getVillageProgress(village.village_id);
                                        return (
                                            <div
                                                key={village.village_id}
                                                className="mb-4 p-4 bg-gray-50 rounded-lg shadow hover:bg-gray-100 cursor-pointer transition-colors"
                                                onClick={() => handleVillageClick(village)}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-gray-700">
                                                        {village.name}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {filledCount}/{total} ({percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4">
                                                    <div
                                                        className={`${colorClass[color]} h-4 rounded-full transition-all duration-300`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
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
                                        const tabType = activeTab === 'surveyed' ? 'Surveyed' : 'YetToBeSurveyed';
                                        const paginatedData = getPaginatedData(currentData);
                                        const totalPages = getTotalPages(currentData);

                                        return (
                                            <>
                                                {/* Download Button */}
                                                <div className="flex justify-end mb-4">
                                                    <button
                                                        onClick={() => exportToExcel(currentData, selectedVillage.name, openTaluka, tabType)}
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
                                                        Total {activeTab === 'surveyed' ? 'Surveyed' : 'Yet-to-be-surveyed'} IFR Holders: {currentData.length}
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
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-300">
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

                                                {currentData.length === 0 && (
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
        </div>
    );
};

export default Talukawiseserve;
