"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { UserCategory } from '../usercategory/userCategory';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';
import UserDatamodel from '../example/ModalExample/UserDatamodel';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    taluka: Taluka[];
    villages: Village[];
}

function extractSchemeDataFromSchemesString(schemesString?: string): { id: number; status: string }[] {
    if (!schemesString) return [];
    const entries = schemesString.split('|');
    const schemeData: { id: number; status: string }[] = [];
    entries.forEach(entry => {
        const match = entry.match(/^(\d+)-/);
        if (match) {
            const id = Number(match[1]);
            const status = entry.split('-').pop()?.trim() || 'NotApplied';
            schemeData.push({ id, status });
        }
    });
    return schemeData;
}

type TalukaSummaryRow = {
    taluka_id: string;
    taluka_name: string;
    served: number;
};

const FarmersDashboard = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [filteredschemes, setFilteredschemes] = useState<Schemesdatas[]>([]);
    const [modalFarmer, setModalFarmer] = useState<FarmdersType | null>(null);
    const [datataluka, setdatataluka] = useState<Taluka[]>([]);
    const [datavillage, setdatavillages] = useState<Village[]>([]);

    // Add filter states
    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');
    const [selectedServed, setSelectedServed] = useState<string>('');
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);

    useEffect(() => {
        if (farmersData) {
            setDataschems(farmersData.schemes);
            setDatafarmers(farmersData.farmers);
            setdatataluka(farmersData.taluka);
            setdatavillages(farmersData.villages);
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

        // "Served" filter = Surveyed farmers only (update_record not empty)
        if (selectedTaluka && selectedServed === 'served') {
            filtered = filtered.filter(farmer => !!farmer.update_record && farmer.update_record.trim() !== '');
        }
        
        setFilteredFarmers(filtered);
    }, [datafarmers, selectedTaluka, selectedVillage, selectedServed]);

    // If Taluka is "All" and Served filter is applied, Village filter doesn't make sense (we show taluka-wise summary)
    useEffect(() => {
        if (!selectedTaluka && selectedServed && selectedVillage) {
            setSelectedVillage('');
        }
    }, [selectedTaluka, selectedServed, selectedVillage]);

    const talukaSummaryRows: TalukaSummaryRow[] = useMemo(() => {
        // Build Surveyed ("Served") counts for ALL talukas (update_record not empty)
        const servedCounts = new Map<string, number>();

        for (const farmer of datafarmers) {
            const tid = String(farmer.taluka_id || '');
            if (!tid) continue;
            const isSurveyed = !!farmer.update_record && farmer.update_record.trim() !== '';
            if (isSurveyed) {
                servedCounts.set(tid, (servedCounts.get(tid) || 0) + 1);
            }
        }

        return datataluka.map(t => {
            const tid = String(t.taluka_id);
            return {
                taluka_id: tid,
                taluka_name: t.name,
                served: servedCounts.get(tid) || 0,
            };
        });
    }, [datafarmers, datataluka]);

    const allfarmersname = filteredFarmers

    const handleBenefitedClick = (schemeIds: number[], farmer: FarmdersType) => {
        const benefitedSchemes = dataschems.filter(scheme =>
            schemeIds.includes(scheme.scheme_id)
        );
        setModalTitle(`Benefited Schemes`);
        setFilteredschemes(benefitedSchemes);
        setModalFarmer(farmer);
        setIsModalOpen(true);
    };

    const handleNotBenefitedClickschemes = (schemeIds: number[], farmer: FarmdersType) => {
        const notBenefitedSchemes = dataschems.filter(scheme =>
            schemeIds.includes(scheme.scheme_id)
        );
        setModalTitle('Non-Benefited Schemes');
        setFilteredschemes(notBenefitedSchemes);
        setModalFarmer(farmer);
        setIsModalOpen(true);
    };

    const handleDownloadExcel = () => {
        const schemesToExport = filteredschemes;
        if (!schemesToExport?.length) return;
        const ifrName = modalFarmer ? (modalFarmer.farmer_record?.split('|')[0] || modalFarmer.name || '-') : '-';
        const mobileNo = modalFarmer ? (modalFarmer.farmer_record?.split('|')[6] || modalFarmer.contact_no || '-') : '-';
        const villageName = modalFarmer ? (datavillage.find(v => String(v.village_id) === String(modalFarmer.village_id))?.marathi_name || '-') : '-';
        const talukaName = modalFarmer ? (datataluka.find(t => String(t.taluka_id) === String(modalFarmer.taluka_id))?.name || '-') : '-';
        const excelData = schemesToExport.map((scheme, idx) => {
            return {
                "Sr.No": idx + 1,
                "IFR Holders Name": ifrName,
                "Mobile No": mobileNo,
                "Village": villageName,
                "Taluka": talukaName,
                "Scheme Name": scheme.scheme_name,
                "Beneficiary Name": scheme.beneficiery_name,
                "Applied At": scheme.applyed_at || '-',
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Schemes");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const fileName = (modalTitle || "Schemes").replace(/\s+/g, "_") + "_Schemes.xlsx";
        saveAs(blob, fileName);
    };

    const handleDownloadAllExcel = () => {
        const farmersToExport = allfarmersname;
        if (!farmersToExport?.length) return;
        const excelData = farmersToExport.map((farmer, idx) => {
            const schemeData = extractSchemeDataFromSchemesString(farmer.schemes);
            const benefitedIds = [...new Set(schemeData.filter(s => s.status.toLowerCase() === 'benefit received').map(s => s.id).filter(id => dataschems.some(scheme => scheme.scheme_id === id)))];
            const notBenefitedIds = [...new Set(schemeData.filter(s => s.status.toLowerCase() !== 'benefit received').map(s => s.id).filter(id => dataschems.some(scheme => scheme.scheme_id === id)))];
            const benefitedNames = benefitedIds.map(id => dataschems.find(s => s.scheme_id === id)?.scheme_name).filter(Boolean) as string[];
            const notBenefitedNames = notBenefitedIds.map(id => dataschems.find(s => s.scheme_id === id)?.scheme_name).filter(Boolean) as string[];
            const villageName = datavillage.find(v => String(v.village_id) === String(farmer.village_id))?.marathi_name || '-';
            const talukaName = datataluka.find(t => String(t.taluka_id) === String(farmer.taluka_id))?.name || '-';
            return {
                "Sr.No": idx + 1,
                "IFR Holders Name": farmer.farmer_record?.split('|')[0] || farmer.name || '-',
                "Mobile No": farmer.farmer_record?.split('|')[6] || farmer.contact_no || '-',
                "Village": villageName,
                "Taluka": talukaName,
                "Benefited (Yes) Count": benefitedIds.length,
                "Benefited Scheme Names": benefitedNames.length ? benefitedNames.join(", ") : "-",
                "Not Benefited (No) Count": notBenefitedIds.length,
                "Not Benefited Scheme Names": notBenefitedNames.length ? notBenefitedNames.join(", ") : "-",
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        worksheet["!cols"] = [
            { wch: 6 },
            { wch: 22 },
            { wch: 14 },
            { wch: 18 },
            { wch: 14 },
            { wch: 12 },
            { wch: 40 },
            { wch: 12 },
            { wch: 40 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "IFR_Holders");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, "IFR_Holders_All_Data.xlsx");
    };

    // Create filter options
    const talukaOptions = datataluka.map(taluka => ({
        label: taluka.name,
        value: taluka.taluka_id.toString()
    }));

    const villageOptions = datavillage
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
                        setSelectedServed(''); // Reset served when taluka changes
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
                    disabled={!selectedTaluka && selectedServed === 'served'}
                >
                    <option value="">All Village</option>
                    {villageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Served</label>
                    <select
                        className="border rounded px-3 py-2 min-w-[170px]"
                        value={selectedServed}
                        onChange={(e) => setSelectedServed(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="served">Served</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2 mt-7">
                <button
                    onClick={() => {
                        setSelectedTaluka('');
                        setSelectedVillage('');
                        setSelectedServed('');
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
                disabled={allfarmersname.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
            >
                डाउनलोड करा (Excel) - All Data
            </button>
            <div className="text-sm text-gray-600 flex items-center">
                Showing {allfarmersname.length} IFR Holders
            </div>
        </div>
    );

    const talukaSummaryColumns: Column<TalukaSummaryRow>[] = [
        { key: 'taluka_name', label: 'Taluka', accessor: 'taluka_name' },
        { key: 'served', label: 'Served Count', accessor: 'served' },
    ];

    const columns: Column<FarmdersType>[] = [
        {
            key: 'scheme_name',
            label: 'IFR holders Name',
            accessor: 'name',
            render: (farmer) => (
                <span>
                    <UserDatamodel
                        farmersid={farmer.farmer_id.toString()}
                        datafarmers={filteredFarmers}
                        farmername={farmer.farmer_record?.split('|')[0]}
                        datavillage={datavillage}
                        datataluka={datataluka}
                    />
                </span>
            )
        },
        {
            key: 'contactno',
            label: 'Contact No',
            accessor: 'contact_no',
            render: (farmer) => <span>{farmer.farmer_record?.split('|')[6] || '-'}</span>
        },
        {
            key: 'Benefited',
            label: 'Yes',
            render: (farmer) => {
                const schemeData = extractSchemeDataFromSchemesString(farmer.schemes);
                const benefitedSchemeIds = schemeData
                    .filter(s => s.status.toLowerCase() === 'benefit received')
                    .map(s => s.id);
                const idsInData = [...new Set(benefitedSchemeIds.filter(id =>
                    dataschems.some(scheme => scheme.scheme_id === id)
                ))];
                const count = idsInData.length;

                return (
                    <button
                        onClick={() => handleBenefitedClick(idsInData, farmer)}
                        className="text-blue-700 font-bold underline cursor-pointer"
                    >
                        {count}
                    </button>
                );
            }
        },
        {
            key: 'NotBenefited',
            label: 'No',
            render: (farmer) => {
                const schemeData = extractSchemeDataFromSchemesString(farmer.schemes);
                const notBenefitedSchemeIds = schemeData
                    .filter(s => s.status.toLowerCase() !== 'benefit received')
                    .map(s => s.id);
                const idsInData = [...new Set(notBenefitedSchemeIds.filter(id =>
                    dataschems.some(scheme => scheme.scheme_id === id)
                ))];
                const count = idsInData.length;

                return (
                    <button
                        onClick={() => handleNotBenefitedClickschemes(idsInData, farmer)}
                        className="text-red-700 font-bold underline cursor-pointer"
                    >
                        {count}
                    </button>
                );
            }
        }
    ];

    const handleclosemodel = () => {
        setModalFarmer(null);
        setIsModalOpen(false);
    };

    return (
        <div className='bg-white'>
            <div className="p-4 rounded-lg w-full border bg-white">
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">
                    IFR Holders by Scheme
                </h2>
                
                <FilterComponent />
                
                {!selectedTaluka && selectedServed === 'served' ? (
                    <Simpletableshowdata
                        data={talukaSummaryRows}
                        inputfiled={
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                                <div className="col-span-1"></div>
                            </div>
                        }
                        columns={talukaSummaryColumns}
                        title=""
                        filterOptions={[]}
                        searchKey="taluka_name"
                    />
                ) : (
                    <Simpletableshowdata
                        data={allfarmersname}
                        inputfiled={
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                                <div className="col-span-1"></div>
                            </div>
                        }
                        columns={columns}
                        title=""
                        filterOptions={[]}
                        searchKey="name"
                    />
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-4 z-99999">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex flex-col gap-2 p-4 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{modalTitle}</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadExcel}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    >
                                        डाउनलोड करा (Excel)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleclosemodel()}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            {modalFarmer && (
                                <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                    <span><strong>IFR Name:</strong> {modalFarmer.farmer_record?.split('|')[0] || modalFarmer.name || '-'}</span>
                                    <span><strong>Mobile No:</strong> {modalFarmer.farmer_record?.split('|')[6] || modalFarmer.contact_no || '-'}</span>
                                    <span><strong>Village:</strong> {datavillage.find(v => String(v.village_id) === String(modalFarmer.village_id))?.marathi_name || '-'}</span>
                                    <span><strong>Taluka:</strong> {datataluka.find(t => String(t.taluka_id) === String(modalFarmer.taluka_id))?.name || '-'}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 ">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sr.No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IFR Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Mobile No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Village
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Taluka
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Schemes
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Beneficiary
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Applied
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredschemes.map((scheme, index) => (
                                            <tr key={scheme.scheme_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {modalFarmer ? (modalFarmer.farmer_record?.split('|')[0] || modalFarmer.name || '-') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {modalFarmer ? (modalFarmer.farmer_record?.split('|')[6] || modalFarmer.contact_no || '-') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {modalFarmer ? (datavillage.find(v => String(v.village_id) === String(modalFarmer.village_id))?.marathi_name || '-') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {modalFarmer ? (datataluka.find(t => String(t.taluka_id) === String(modalFarmer.taluka_id))?.name || '-') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {scheme.scheme_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {scheme.beneficiery_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {scheme.applyed_at || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmersDashboard;
