"use client";
import React, { useMemo, useState, useCallback, startTransition } from 'react';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { FarmdersType } from '../farmersdata/farmers';
import { Documents } from '../Documentsdata/documents';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
    getParsedFarmerDocuments,
    isDocumentAvailable,
    isDocumentNotAvailable,
    isDocumentUpdationNeeded,
} from '../farmersdata/parseFarmerDocuments';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalFarmers, setModalFarmers] = useState<FarmdersType[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');

    const datafarmers = farmersData.farmers;
    const documents = farmersData.documents;

    const talukaNameById = useMemo(() => {
        const map = new Map<number, string>();
        farmersData.taluka.forEach((t) => map.set(Number(t.taluka_id), t.name));
        return map;
    }, [farmersData.taluka]);

    const villageNameById = useMemo(() => {
        const map = new Map<number, string>();
        farmersData.villages.forEach((v) => map.set(Number(v.village_id), v.marathi_name || v.name));
        return map;
    }, [farmersData.villages]);

    const filteredFarmers = useMemo(() => {
        let filtered = datafarmers;
        if (selectedTaluka) {
            filtered = filtered.filter((farmer) => String(farmer.taluka_id) === selectedTaluka);
        }
        if (selectedVillage) {
            filtered = filtered.filter((farmer) => String(farmer.village_id) === selectedVillage);
        }
        return filtered;
    }, [datafarmers, selectedTaluka, selectedVillage]);

    const documentUsageList = useMemo((): DocumentUsage[] => {
        if (!filteredFarmers.length || !documents.length) return [];

        const counts = documents.map((doc) => ({
            document: doc,
            countHas: 0,
            countNotHas: 0,
            countUpdationNeeded: 0,
        }));

        for (let i = 0; i < filteredFarmers.length; i++) {
            const docMap = getParsedFarmerDocuments(filteredFarmers[i]);
            for (let d = 0; d < documents.length; d++) {
                const doc = documents[d];
                const entry = docMap[String(doc.id)];
                const bucket = counts[d];
                if (entry) {
                    if (entry.available === 'Yes') bucket.countHas++;
                    if (entry.notAvailable === 'Yes') bucket.countNotHas++;
                    if (entry.updateNeeded === 'Yes') bucket.countUpdationNeeded++;
                } else {
                    bucket.countNotHas++;
                }
            }
        }
        return counts;
    }, [filteredFarmers, documents]);

    const openModal = useCallback((docId: number, docName: string, type: ModalType) => {
        setModalTitle(`${docName} - ${type === 'has' ? 'Available' : type === 'not' ? 'Not Available' : 'Updation Needed'}`);
        startTransition(() => {
            const filteredFarmersForModal = filteredFarmers.filter((farmer) => {
                if (type === 'has') return isDocumentAvailable(farmer, docId);
                if (type === 'not') return isDocumentNotAvailable(farmer, docId);
                if (type === 'updation') return isDocumentUpdationNeeded(farmer, docId);
                return false;
            });
            setModalFarmers(filteredFarmersForModal);
            setCurrentPage(1);
            setIsModalOpen(true);
        });
    }, [filteredFarmers]);

    const totalPages = Math.ceil(modalFarmers.length / rowsPerPage) || 1;
    const paginatedFarmers = useMemo(
        () => modalFarmers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
        [modalFarmers, currentPage]
    );

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const handleDownloadExcel = () => {
        const excelData = modalFarmers.map((farmer, idx) => ({
            "Sr.No": idx + 1,
            "IFR Holder": farmer.farmer_record?.split('|')[0] || "",
            "Contact No": farmer.farmer_record?.split('|')[6] || "-",
            "Taluka": talukaNameById.get(Number(farmer.taluka_id)) || "",
            "Village": villageNameById.get(Number(farmer.village_id)) || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `${modalTitle.replace(/\s+/g, "_")}_Farmers.xlsx`);
    };

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

    const talukaOptions = useMemo(
        () => farmersData.taluka.map((taluka) => ({
            label: taluka.name,
            value: taluka.taluka_id.toString(),
        })),
        [farmersData.taluka]
    );

    const villageOptions = useMemo(
        () => farmersData.villages
            .filter((village) => !selectedTaluka || String(village.taluka_id) === selectedTaluka)
            .map((village) => ({
                label: village.marathi_name,
                value: village.village_id.toString(),
            })),
        [farmersData.villages, selectedTaluka]
    );

    const columns: Column<DocumentUsage>[] = useMemo(() => [
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
    ], [openModal]);

    return (
        <div className='bg-white'>
            <div className="p-4 rounded-lg w-full border bg-white">
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">
                    Availability of documents
                </h2>

                <div className="flex flex-col md:flex-row gap-4 mb-4 flex-wrap items-end">
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Taluka</label>
                            <select
                                className="border rounded px-3 py-2 min-w-[150px]"
                                value={selectedTaluka}
                                onChange={(e) => {
                                    setSelectedTaluka(e.target.value);
                                    setSelectedVillage('');
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IFR holders</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taluka</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Village</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedFarmers.map((farmer, index) => {
                                            const record = farmer.farmer_record?.split('|') || [];
                                            return (
                                                <tr key={farmer.farmer_id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {(currentPage - 1) * rowsPerPage + index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{record[0] || ""}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{record[6] || ""}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{talukaNameById.get(Number(farmer.taluka_id)) || ""}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{villageNameById.get(Number(farmer.village_id)) || ""}</td>
                                                </tr>
                                            );
                                        })}
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
