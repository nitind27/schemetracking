"use client";

import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import React from 'react';
import * as XLSX from 'xlsx';

import { Column } from "../tables/tabletype";
import { FarmdersType } from './farmers';
import { Village } from '../Village/village';
import { Taluka } from '../Taluka/Taluka';
import { Schemesdatas } from '../schemesdata/schemes';

import Ifrsmaplocations from './Ifrsmaplocations';
import { Documents } from '../Documentsdata/documents';
import { Servefilterdatatable } from '../tables/Servefilterdatatable';
import Pagination from '../tables/Pagination';

interface FarmersdataProps {
    data: FarmdersType[];
    datavillage: Village[];
    datataluka: Taluka[];
    dataschems: Schemesdatas[];
    documents: Documents[];
}
type FarmerDocumentStatus = {
    updateNeeded: string;
    available: string;
    notAvailable: string;
};
type FarmerDocumentMap = Record<string, FarmerDocumentStatus>;
const Servedata: React.FC<FarmersdataProps> = ({
    data,
    datavillage,
    datataluka,
    dataschems,
    documents,
}) => {
    const [filters, setFilters] = useState({
        talukaId: null as string | null,
        villageId: null as string | null,
        categoryName: null as string | null,
        aadhaarwith: null as string | null
    });

    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalFarmer, setModalFarmer] = useState<FarmdersType | null>(null);

    const [docPage, setDocPage] = useState(1);
    const docsPerPage = 10;
    const [modalSchemesOpen, setModalSchemesOpen] = useState(false);
    const [modalSchemesFarmer, setModalSchemesFarmer] = useState<FarmdersType | null>(null);
    const [schemePage, setSchemePage] = useState(1);
    const schemesPerPage = 10;

    useEffect(() => {
        const talukaId = sessionStorage.getItem('taluka_id');
        const villageId = sessionStorage.getItem('village_id');
        const categoryName = sessionStorage.getItem('category_name');
        const aadhaarwith = sessionStorage.getItem('aadharcount');

        setFilters({
            talukaId,
            villageId,
            categoryName,
            aadhaarwith
        });

        // Also set UI filters
        setSelectedTaluka('');
        setSelectedVillage('');
    }, []);

    const talukaOptions = useMemo(() =>
        datataluka.map((taluka) => ({
            label: taluka.name,
            value: taluka.taluka_id.toString()
        })),
        [datataluka]
    );

    const villageOptions = useMemo(() =>
        selectedTaluka
            ? datavillage
                .filter(village => village.taluka_id == selectedTaluka)
                .map(village => ({
                    label: village.marathi_name,
                    value: village.village_id.toString()
                }))
            : [],
        [datavillage, selectedTaluka]
    );

    function extractSchemeDataFromSchemesString(schemesString?: string): { id: number; status: string }[] {
        if (!schemesString) return [];
        const entries = schemesString.split('|');
        const schemeData: { id: number; status: string }[] = [];
        entries.forEach(entry => {
            // Try to match id at start, or id as first segment
            const idMatch = entry.match(/^(\d+)[-]/) || entry.match(/^(\d+)---/);
            if (idMatch) {
                const id = Number(idMatch[1]);
                const status = entry.split('-').pop()?.trim() || 'NotApplied';
                schemeData.push({ id, status });
            }
        });
        return schemeData;
    }
    const paginatedSchemes = dataschems.slice((schemePage - 1) * schemesPerPage, schemePage * schemesPerPage);

    const filteredFarmers = useMemo(() => {
        let result = data;

        // Apply date filter if selected
        if (selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            result = result.filter(farmer => {
                if (!farmer.update_record) return false;

                // Split the update_record by pipe and check each segment
                return farmer.update_record.split('|').some(segment => {
                    // Extract the date part from each segment
                    const datePart = segment.split('/')[1];
                    return datePart === dateStr;
                });
            });
        }

        if (
            selectedTaluka === '0' &&
            selectedVillage === '0' &&
            filters.talukaId === '0' &&
            filters.villageId === '0'
        ) {
            return result;
        }

        if (!selectedTaluka && !selectedVillage) {
            return result;
        }


        if (selectedTaluka && filters.aadhaarwith != '1' && filters.aadhaarwith != '0') {
            result = result.filter(
                (f) =>
                    f.taluka_id === selectedTaluka
            );
        }

        if (selectedTaluka && filters.aadhaarwith == '1') {
            result = result.filter(
                (f) =>
                    f.taluka_id === selectedTaluka &&
                    (f.aadhaar_no != '')
            );
        }
        if (selectedVillage) {
            result = result.filter(
                (f) =>
                    f.village_id === selectedVillage &&
                    (filters.aadhaarwith !== '1' || f.aadhaar_no !== '')
            );
        }

        return result;
    }, [data, filters, selectedTaluka, selectedVillage, selectedDate]);

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
    };

    const handleTodayClick = () => {
        const today = new Date();
        setSelectedDate(today);
    };

    const columns: Column<FarmdersType>[] = [
        {
            key: 'name',
            label: 'Name',
            accessor: 'name',
            render: (item) => {
                const nameParts = item.farmer_record?.split('|') || [];
                return <span>{nameParts[0] || ''}</span>;
            }
        }
        ,

        {
            key: 'village_id',
            label: 'Village',
            accessor: 'village_id',
            render: (item) => (
                <span>
                    {datavillage.find(v => v.village_id === Number(item.village_id))?.name}
                </span>
            )
        },
        {
            key: 'taluka_id',
            label: 'Taluka',
            accessor: 'taluka_id',
            render: (item) => (
                <span>
                    {datataluka.find(t => t.taluka_id === Number(item.taluka_id))?.name}
                </span>
            )
        },
        {
            key: 'gat_no',
            label: 'Gat No',
            accessor: 'gat_no',
            render: (item) => {
                const nameParts = item.farmer_record?.split('|') || [];
                return <span>{nameParts[2] || ''}</span>;
            }
        },
        {
            key: 'vanksetra',
            label: 'Vanksetra',
            accessor: 'vanksetra',
            render: (item) => {
                const nameParts = item.farmer_record?.split('|') || [];
                return <span>{nameParts[3] || ''}</span>;
            }
        },

        {
            key: 'aadhaar_no',
            label: 'Aadhaar No',
            accessor: 'aadhaar_no',
            render: (item) => {
                const nameParts = item.farmer_record?.split('|') || [];
                return <span>{nameParts[5] || ''}</span>;
            }
        },
        {
            key: 'contact_no',
            label: 'Contact No & Email',
            accessor: 'contact_no',
            render: (item) => {
                const nameParts = item.farmer_record?.split('|') || [];
                return <span>{nameParts[6] || ''} <br /> {nameParts[7] || ''}</span>;
            }
        },
       
        {
            key: 'kisan_id',
            label: 'Claim Id',
            accessor: 'kisan_id',
            render: (item) => {
                const nameParts = item.farmer_record?.split('|') || [];
                return <span>{nameParts[15] || ''}</span>;
            }
        },
        {
            key: 'documents',
            label: 'Documents',
            accessor: 'documents',
            render: (item) => (
                <button
                    className="px-2 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                    onClick={() => {
                        setModalFarmer(item);
                        setModalOpen(true);
                    }}
                >
                    Availability
                </button>
            )
        },
        {
            key: 'schemes',
            label: 'Schemes',
            accessor: 'schemes',
            render: (item) => (
                <button
                    className="px-2 py-3 bg-green-500 text-white rounded hover:bg-green-600 whitespace-nowrap"
                    onClick={() => {
                        setModalSchemesFarmer(item);
                        setModalSchemesOpen(true);
                        setSchemePage(1);
                    }}
                >
                    Availability
                </button>
            )
        },
        {
            key: 'location',
            label: 'Location',
            render: (item) => {
                const coordinates = item.gis
                    ?.split('|')
                    .map((entry) => {
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
                    .filter((coord) => coord !== null);

                return (
                    <>
                        {coordinates && coordinates.length > 0 && (
                            <Ifrsmaplocations coordinates={coordinates as { lat: number; lng: number }[]} />
                        )}
                    </>
                );
            }
        }
    ];

    const parseFarmerDocuments = (farmer: FarmdersType | null) => {
        if (!farmer || typeof farmer.documents !== 'string') return {};
        // Example segment: "1--No-Yes-No"
        return farmer.documents.split('|').reduce<FarmerDocumentMap>((acc, seg) => {
            const [id, rest] = seg.split('--');
            if (id && rest) {
                const [updateNeeded, available, notAvailable] = rest.split('-');
                acc[id] = { updateNeeded, available, notAvailable };
            }
            return acc;
        }, {});
    };

    // Helper to get Marathi status for document
    const getDocumentStatusMarathi = (docInfo: FarmerDocumentStatus | undefined) => {
        if (!docInfo) return 'माहिती नाही';
        if (docInfo.available === 'Yes') return 'उपलब्ध';
        if (docInfo.notAvailable === 'Yes') return 'उपलब्ध नाही';
        if (docInfo.updateNeeded === 'Yes') return 'अपडेट आवश्यक';
        return 'माहिती नाही';
    };

    // Export to Excel logic
    const handleExportExcel = () => {
        // Prepare header
        const baseHeaders = [
            'Name',
            'Village',
            'Taluka',
            'Gat No',
            'Vanksetra',
            'Aadhaar No',
            'Contact No',
            'Email',
            'Claim Id',
            'Documents', // Single column for all documents
            'Schemes',   // Single column for all schemes
        ];

        // Prepare data rows
        const rows = filteredFarmers.map(farmer => {
            const nameParts = farmer.farmer_record?.split('|') || [];
            const villageName = datavillage.find(v => v.village_id === Number(farmer.village_id))?.name || '';
            const talukaName = datataluka.find(t => t.taluka_id === Number(farmer.taluka_id))?.name || '';
            const contactNo = nameParts[6] || '';
            const email = nameParts[7] || '';
            const docMap = parseFarmerDocuments(farmer);
            // Documents as single string
            const docStatuses = documents.map(doc => `${doc.document_name}: ${getDocumentStatusMarathi(docMap[String(doc.id)])}`);
            const docStatusString = docStatuses.join(', ');

            // Schemes as single string
            const farmerSchemes = extractSchemeDataFromSchemesString(farmer.schemes);
            const schemeStatuses = dataschems.map(scheme => {
                const found = farmerSchemes.find(s => s.id === scheme.scheme_id);
                let statusText = 'लाभार्थी नाही'; // Not Benefited
                if (found) {
                    const status = found.status.toLowerCase();
                    if (status.includes('benefit') || status.includes('लाभ')) {
                        statusText = 'लाभार्थी'; // Benefited
                    } else if (status.includes('applied') || status.includes('अर्ज')) {
                        statusText = 'अर्ज केले'; // Applied
                    }
                }
                return `${scheme.scheme_name_marathi || scheme.scheme_name}: ${statusText}`;
            });
            const schemeStatusString = schemeStatuses.join(', ');

            return [
                nameParts[0] || '',
                villageName,
                talukaName,
                nameParts[2] || '',
                nameParts[3] || '',
                nameParts[5] || '',
                contactNo,
                email,
                nameParts[15] || '',
                docStatusString,
                schemeStatusString
            ];
        });

        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet([baseHeaders, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Farmers');
        XLSX.writeFile(wb, 'farmers_data.xlsx');
    };

    // Pagination logic for documents in modal
    const totalDocPages = Math.ceil(documents.length / docsPerPage);
    const paginatedDocs = documents.slice((docPage - 1) * docsPerPage, docPage * docsPerPage);

    // Pagination logic for schemes in modal
    const totalSchemePages = Math.ceil(dataschems.length / schemesPerPage);

    return (
        <div className="">
            {/* Export to Excel Button */}
            <div className="mb-4 flex justify-end">
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={handleExportExcel}
                >
                    Export to Excel
                </button>
            </div>
            {/* Modal for document check */}
            {modalOpen && modalFarmer && (
                <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
                    <div className="bg-white rounded shadow-lg max-w-lg w-full mx-2">
                        <div className="flex justify-between items-center py-3 px-4 border-b">
                            <h2 className="text-lg font-bold">Document Availability</h2>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setModalOpen(false)}
                                aria-label="Close"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <table className="min-w-full border">
                                <thead>
                                    <tr>
                                        <th className="border px-2 py-1">अ.क्र.</th>
                                        <th className="border px-2 py-1">दस्तऐवजाचे नाव</th>
                                        <th className="border px-2 py-1">उपलब्धता</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDocs.map((doc, idx) => {
                                        const farmerDocMap = parseFarmerDocuments(modalFarmer);
                                        const docInfo = farmerDocMap[String(doc.id)];

                                        let status = '';
                                        let statusClass = '';

                                        if (docInfo) {
                                            if (docInfo.available === 'Yes') {
                                                status = 'उपलब्ध';
                                                statusClass = 'text-green-600';
                                            } else if (docInfo.notAvailable === 'Yes') {
                                                status = 'उपलब्ध नाही';
                                                statusClass = 'text-red-600';
                                            } else if (docInfo.updateNeeded === 'Yes') {
                                                status = 'अपडेट आवश्यक';
                                                statusClass = 'text-yellow-600';
                                            } else {
                                                status = 'माहिती नाही';
                                                statusClass = 'text-gray-600';
                                            }
                                        } else {
                                            status = 'माहिती नाही';
                                            statusClass = 'text-gray-600';
                                        }

                                        return (
                                            <tr key={doc.id}>
                                                <td className="border px-2 py-1 text-center">{(docPage - 1) * docsPerPage + idx + 1}</td>
                                                <td className="border px-2 py-1">{doc.document_name}</td>
                                                <td className={`border px-2 py-1 text-center ${statusClass}`}>{status}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    currentPage={docPage}
                                    totalPages={totalDocPages}
                                    onPageChange={setDocPage}
                                />
                            </div>
                        </div>
                        <div className="py-3 px-4 text-right border-t">
                            <button
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                onClick={() => setModalOpen(false)}
                            >
                                बंद करा
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for schemes check */}
            {modalSchemesOpen && modalSchemesFarmer && (
                <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
                    <div className="bg-white rounded shadow-lg max-w-lg w-full mx-2">
                        <div className="flex justify-between items-center py-3 px-4 border-b">
                            <h2 className="text-lg font-bold">Schemes Availability</h2>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setModalSchemesOpen(false)}
                                aria-label="Close"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <table className="min-w-full border">
                                <thead>
                                    <tr>
                                        <th className="border px-2 py-1">अ.क्र.</th>
                                        <th className="border px-2 py-1">योजनेचे नाव</th>
                                        <th className="border px-2 py-1">स्थिती</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSchemes.map((scheme, idx) => {
                                        const farmerSchemes = extractSchemeDataFromSchemesString(modalSchemesFarmer.schemes);
                                        const found = farmerSchemes.find(s => s.id === scheme.scheme_id);
                                        let statusText = 'लाभार्थी नाही'; // Not Benefited
                                        if (found) {
                                            const status = found.status.toLowerCase();
                                            if (status.includes('benefit') || status.includes('लाभ')) {
                                                statusText = 'लाभार्थी'; // Benefited
                                            } else if (status.includes('applied') || status.includes('अर्ज')) {
                                                statusText = 'अर्ज केले'; // Applied
                                            }
                                        }
                                        return (
                                            <tr key={scheme.scheme_id}>
                                                <td className="border px-2 py-1 text-center">{(schemePage - 1) * schemesPerPage + idx + 1}</td>
                                                <td className="border px-2 py-1">{scheme.scheme_name_marathi || scheme.scheme_name}</td>
                                                <td className={`border px-2 py-1 text-center ${statusText === 'लाभार्थी' ? 'text-green-600' : statusText === 'अर्ज केले' ? 'text-yellow-600' : 'text-red-600'}`}>{statusText}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    currentPage={schemePage}
                                    totalPages={totalSchemePages}
                                    onPageChange={setSchemePage}
                                />
                            </div>
                        </div>
                        <div className="py-3 px-4 text-right border-t">
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onClick={() => setModalSchemesOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Servefilterdatatable
                key={JSON.stringify(filteredFarmers)}
                data={filteredFarmers}
                inputfiled={[]}
                columns={columns}
                title="User Category"
                filterOptions={[
                    {
                        label: "Taluka",
                        options: talukaOptions,
                        value: selectedTaluka,
                        onChange: (value) => {
                            setSelectedTaluka(value);
                            setSelectedVillage('');
                        }
                    },
                    {
                        label: "Village",
                        options: villageOptions,
                        value: selectedVillage,
                        onChange: (value) => setSelectedVillage(value)
                    }
                ]}
                dateFilter={{
                    selectedDate,
                    onDateChange: handleDateChange,
                    onTodayClick: handleTodayClick
                }}
                submitbutton={[]}
            />
        </div>
    );
};

export default Servedata;