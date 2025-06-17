"use client";
import React, { useEffect, useState } from 'react';
import { UserCategory } from '../usercategory/userCategory';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';
import UserDatamodel from '../example/ModalExample/UserDatamodel';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';

interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    taluka: Taluka[];
    villages: Village[];
}

// Helper: Parse farmer.schemes string for scheme IDs and statuses
function extractSchemeDataFromSchemesString(schemesString?: string): { id: number; status: string }[] {
    if (!schemesString) return [];
    const entries = schemesString.split('|');
    const schemeData: { id: number; status: string }[] = [];
    entries.forEach(entry => {
        const match = entry.match(/^(\d+)-/);
        if (match) {
            const id = Number(match[1]);
            const status = entry.split('-').pop()?.trim() || 'NotApplied'; // Get the last part as status
            schemeData.push({ id, status });
        }
    });
    return schemeData;
}

const FarmersDashboard = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);
    const [filteredschemes, setFilteredschemes] = useState<Schemesdatas[]>([]);
    const [datataluka, setdatataluka] = useState<Taluka[]>([]);
    const [datavillage, setdatavillages] = useState<Village[]>([]);

    useEffect(() => {
        if (farmersData) {
            setDataschems(farmersData.schemes);
            setDatafarmers(farmersData.farmers);
            setdatataluka(farmersData.taluka);
            setdatavillages(farmersData.villages);
        }
    }, [farmersData]);

    // Filter farmers who have schemes string non-empty
    const allfarmersname = datafarmers.filter(farmer => {
        return farmer.schemes && farmer.schemes.trim() !== "";
    });

    const handleBenefitedClick = (schemeIds: number[]) => {
        const benefitedSchemes = dataschems.filter(scheme =>
            schemeIds.includes(scheme.scheme_id)
        );
   
        setModalTitle(`Benefited Schemes`);
        setFilteredschemes(benefitedSchemes);
        setIsModalOpen(true);
    };

    const handleNotBenefitedClickschemes = (schemeIds: number[]) => {
        const notBenefitedSchemes = dataschems.filter(scheme =>
            schemeIds.includes(scheme.scheme_id) 
        );

        setModalTitle('Non-Benefited Schemes');
        setFilteredschemes(notBenefitedSchemes);
        setIsModalOpen(true);
    };


    const columns: Column<FarmdersType>[] = [
        {
            key: 'scheme_name',
            label: 'IFR holders Name',
            accessor: 'name',
            render: (farmer) => (
                <span>
                    <UserDatamodel
                        farmersid={farmer.farmer_id.toString()}
                        datafarmers={datafarmers}
                        farmername={farmer.name}
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
            render: (farmer) => <span>{farmer.contact_no || '-'}</span>
        },
        {
            key: 'Benefited',
            label: 'Benefited',
            render: (farmer) => {
                const schemeData = extractSchemeDataFromSchemesString(farmer.schemes);
                const benefitedSchemeIds = schemeData
                    .filter(s => s.status.toLowerCase() === 'benefit received')
                    .map(s => s.id);
                const count = benefitedSchemeIds.length;

                return (
                    <button
                        onClick={() => handleBenefitedClick(benefitedSchemeIds)}
                        className="text-blue-700 hover:underline cursor-pointer"
                    >
                        {count}
                    </button>
                );
            }
        },
        {
            key: 'NotBenefited',
            label: 'Not Benefited',
            render: (farmer) => {
                const schemeData = extractSchemeDataFromSchemesString(farmer.schemes);
                const notBenefitedSchemeIds = schemeData
                    .filter(s => s.status.toLowerCase() !== 'benefit received')
                    .map(s => s.id);
                const count = notBenefitedSchemeIds.length;

                return (
                    <button
                        onClick={() => handleNotBenefitedClickschemes(notBenefitedSchemeIds)}
                        className="hover:underline cursor-pointer text-red-700"
                    >
                        {count}
                    </button>
                );
            }
        }

    ];

    const handleclosemodel = () => {
        setFilteredFarmers([]);
        setFilteredschemes([]);
        setIsModalOpen(false);
    };

    return (
        <div className='bg-white'>
            <Simpletableshowdata
                data={allfarmersname}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1"></div>
                    </div>
                }
                columns={columns}
                title="Scheme Beneficiaries"
                filterOptions={[]}
                searchKey="name"
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-4 z-99999">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{modalTitle}</h3>
                            <button
                                onClick={() => handleclosemodel()}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
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
                                        {filteredschemes.length > 0 && filteredschemes.map((farmer, index) => (
                                            <tr key={farmer.scheme_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.scheme_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.beneficiery_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.applyed_at}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredFarmers.length > 0 && filteredFarmers.map((farmer) => (
                                            <tr key={farmer.name}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.farmer_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.schemes}
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
