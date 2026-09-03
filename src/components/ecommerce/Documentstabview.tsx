"use client";
import React, { useEffect, useState } from 'react';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { FarmdersType } from '../farmersdata/farmers';
import { Documents } from '../Documentsdata/documents';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { parseFarmerDocuments } from '../farmersdata/parseFarmerDocuments';

interface AllFarmersData {
    farmers: FarmdersType[];
    documents: Documents[];
    taluka: Taluka[];
    villages: Village[];
}

interface DocumentUsage {
    document: Documents;
    countHas: number;
    countNotHas: number;
    countUpdationNeeded: number;
}

type ModalType = 'has' | 'not' | 'updation';

const rowsPerPage = 10;

const Documentstabview = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [documents, setDocuments] = useState<Documents[]>([]);
    const [documentUsageList, setDocumentUsageList] = useState<DocumentUsage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalFarmers, setModalFarmers] = useState<FarmdersType[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Add filter states
    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);

    useEffect(() => {
        if (farmersData) {
            setDatafarmers(farmersData.farmers);
            setDocuments(farmersData.documents);
        }
    }, [farmersData]);

    // Initialize filteredFarmers with all farmers
    useEffect(() => {
        setFilteredFarmers(datafarmers);
    }, [datafarmers]);

    // Filter farmers based on taluka and village selection
    useEffect(() => {
        let filtered = [...datafarmers];
        
        if (selectedTaluka) {
            filtered = filtered.filter(farmer => farmer.taluka_id === selectedTaluka);
        }
        
        if (selectedVillage) {
            filtered = filtered.filter(farmer => farmer.village_id === selectedVillage);
        }
        
        setFilteredFarmers(filtered);
    }, [datafarmers, selectedTaluka, selectedVillage]);

    // Calculate document usage based on filtered farmers
    useEffect(() => {
        if (filteredFarmers.length === 0 || documents.length === 0) {
            setDocumentUsageList([]);
            return;
        }

        const farmersDocsParsed = filteredFarmers.map(farmer =>
            parseFarmerDocuments(typeof farmer.documents === 'string' ? farmer.documents : '')
        );

        const usageList: DocumentUsage[] = documents.map(doc => {
            let countHas = 0;
            let countNotHas = 0;
            let countUpdationNeeded = 0;

            filteredFarmers.forEach((farmer, idx) => {
                const docEntry = farmersDocsParsed[idx][String(doc.id)];
                if (docEntry) {
                    if (docEntry.available === 'Yes') {
                        countHas++;
                    }
                    if (docEntry.notAvailable === 'Yes') {
                        countNotHas++;
                    }
                    if (docEntry.updateNeeded === 'Yes') {
                        countUpdationNeeded++;
                    }
                } else {
                    countNotHas++;
                }
            });

            return {
                document: doc,
                countHas,
                countNotHas,
                countUpdationNeeded
            };
        });

        setDocumentUsageList(usageList);
    }, [filteredFarmers, documents]);

    // Modal logic
    const openModal = (docId: number, docName: string, type: ModalType) => {
        setModalTitle(`${docName} - ${type === 'has' ? 'Available' : type === 'not' ? 'Not Available' : 'Updation Needed'}`);
        // Filter farmers from filteredFarmers instead of datafarmers
        const filteredFarmersForModal = filteredFarmers.filter(farmer => {
            const docMap = parseFarmerDocuments(farmer.documents);
            const entry = docMap[String(docId)];
            if (type === 'has') return entry && entry.available === 'Yes';
            if (type === 'not') return !entry || entry.notAvailable === 'Yes';
            if (type === 'updation') return entry && entry.updateNeeded === 'Yes';
            return false;
        });
        setModalFarmers(filteredFarmersForModal);
        setCurrentPage(1);
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(modalFarmers.length / rowsPerPage);
    const paginatedFarmers = modalFarmers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    // Excel download handler (modal - current farmers list)
    const handleDownloadExcel = () => {
        const excelData = modalFarmers.map((farmer, idx) => ({
            "Sr.No": idx + 1,
            "IFR Holder":farmer.farmer_record?.split('|')[0] || "",
            "Contact No": farmer.farmer_record?.split('|')[6]|| "-",
            "Taluka": farmersData.taluka.find(t => t.taluka_id === Number(farmer.taluka_id))?.name || "",
            "Village": farmersData.villages.find(v => v.village_id === Number(farmer.village_id))?.marathi_name || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `${modalTitle.replace(/\s+/g, "_")}_Farmers.xlsx`);
    };

    // All data Excel download (main table: document availability)
    const handleDownloadAllExcel = () => {
        if (!documentUsageList?.length) return;
        const excelData = documentUsageList.map((usage, idx) => ({
            "Sr.No": idx + 1,
            "Document Name": usage.document.document_name || "-",
            "Available": usage.countHas,
            "Not Available": usage.countNotHas,
            "Updation Needed": usage.countUpdationNeeded,
        }));
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        worksheet["!cols"] = [
            { wch: 6 },
            { wch: 28 },
            { wch: 12 },
            { wch: 14 },
            { wch: 16 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Document_Availability");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, "Document_Availability_All_Data.xlsx");
    };

    // Create filter options
    const talukaOptions = farmersData.taluka.map(taluka => ({
        label: taluka.name,
        value: taluka.taluka_id.toString()
    }));

    const villageOptions = farmersData.villages
        .filter(village => !selectedTaluka || village.taluka_id === selectedTaluka)
        .map(village => ({
            label: village.marathi_name,
            value: village.village_id.toString()
        }));

    // Custom filter component
    const FilterComponent = () => (
        <div className="flex flex-col md:flex-row gap-4 mb-4 flex-wrap items-end">
            <div className="flex flex-col md:flex-row gap-2">
                <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Taluka</label>
                <select
                    className="border rounded px-3 py-2 min-w-[150px]"
                    value={selectedTaluka}
                    onChange={(e) => {
                        setSelectedTaluka(e.target.value);
                        setSelectedVillage(''); // Reset village when taluka changes
                    }}
                >
                    <option value="">All Taluka</option>
                    {talukaOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                </div>
                <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Village</label>
                <select
                    className="border rounded px-3 py-2 min-w-[150px]"
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                >
                    <option value="">All Village</option>
                    {villageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                </div>
                <div className="flex flex-col gap-2 mt-7">
                <button
                    onClick={() => {
                        setSelectedTaluka('');
                        setSelectedVillage('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
            <button
                type="button"
                onClick={handleDownloadAllExcel}
                disabled={documentUsageList.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
            >
                डाउनलोड करा (Excel) - All Data
            </button>
            <div className="text-sm text-gray-600 flex items-center">
                Showing {filteredFarmers.length} IFR Holders
            </div>
        </div>
    );

    const columns: Column<DocumentUsage>[] = [
        {
            key: 'documentName',
            label: 'Document Name',
            accessor: 'document',
            render: (usage) => <span>{usage.document.document_name}</span>
        },
        {
            key: 'available',
            label: 'Available',
            accessor: 'countHas',
            render: (usage) => (
                <span
                    className="text-green-700 font-bold cursor-pointer underline"
                    onClick={() => openModal(usage.document.id, usage.document.document_name, 'has')}
                >
                    {usage.countHas}
                </span>
            )
        },
        {
            key: 'notavailable',
            label: 'Not Available',
            accessor: 'countNotHas',
            render: (usage) => (
                <span
                    className="text-red-700 font-bold cursor-pointer underline"
                    onClick={() => openModal(usage.document.id, usage.document.document_name, 'not')}
                >
                    {usage.countNotHas}
                </span>
            )
        },
        {
            key: 'updationNeeded',
            label: 'Updation Needed',
            accessor: 'countUpdationNeeded',
            render: (usage) => (
                <span
                    className="text-yellow-700 font-bold cursor-pointer underline"
                    onClick={() => openModal(usage.document.id, usage.document.document_name, 'updation')}
                >
                    {usage.countUpdationNeeded}
                </span>
            )
        }
    ];

    return (
        <div className='bg-white'>
            <div className="p-4 rounded-lg w-full border bg-white">
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">
                    Availability of documents
                </h2>
                
                <FilterComponent />
                
                <Simpletableshowdata
                    data={documentUsageList}
                    columns={columns}
                    title=""
                    filterOptions={[]}
                    searchKey="document"
                />
            </div>
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-4 z-999999">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-auto z-999999">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{modalTitle}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4">
                            <button
                                onClick={handleDownloadExcel}
                                className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                डाउनलोड करा
                            </button>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sr.No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IFR holders
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Taluka
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Village
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedFarmers.map((farmer, index) => (
                                            <tr key={farmer.farmer_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(currentPage - 1) * rowsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.farmer_record?.split('|')[0] || ""}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.farmer_record?.split('|')[6] || ""}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmersData.taluka.find((data) => data.taluka_id === Number(farmer.taluka_id))?.name || ""}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmersData.villages.find((data) => data.village_id === Number(farmer.village_id))?.marathi_name || ""}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documentstabview;
