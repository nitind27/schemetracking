"use client"
import React, { useEffect, useState } from 'react'
import { UserCategory } from '../usercategory/userCategory';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';

const SchemesDashboardcounting = () => {
    const [data, setData] = useState<UserCategory[]>([]);
    console.log("data",data)
    const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);

    // Get current scheme IDs once data is loaded
    const schemeIds = dataschems.map(scheme => scheme.scheme_id.toString());

    // Get farmers who have any scheme assigned
    const alldata = datafarmers.filter(farmer => farmer.schemes?.trim() !== "");

    // Find matching schemes based on farmer's schemes
    const matches = dataschems.filter(scheme =>
        alldata.some(farmer => farmer.schemes?.includes(scheme.scheme_id.toString()))
    );

    const handleBenefitedClick = (schemeId: string) => {
        const benefitedFarmers = datafarmers.filter(farmer =>
            farmer.schemes?.includes(schemeId)
        );

        // const scheme = dataschems.find(s => s.scheme_id.toString() === schemeId);
        setModalTitle(`Benefited IFR holders `);
        setFilteredFarmers(benefitedFarmers);
        setIsModalOpen(true);
    };

    const handleNotBenefitedClick = () => {
        const notBenefited = datafarmers.filter(farmer =>
            !schemeIds.some(id => farmer.schemes?.includes(id))
        );

        setModalTitle('Non-Benefited Farmers');
        setFilteredFarmers(notBenefited);
        setIsModalOpen(true);
    };

    const columns: Column<Schemesdatas>[] = [
        {
            key: 'scheme_name',
            label: 'Schemes Name',
            accessor: 'scheme_name',
            render: (scheme) => <span>{scheme.scheme_name}</span>
        },
        {
            key: 'Benefited',
            label: 'Benefited',
            render: (scheme) => (
                <button
                    onClick={() => handleBenefitedClick(scheme.scheme_id.toString())}
                    className="text-blue-700 hover:underline cursor-pointer"
                >
                    {datafarmers.filter(farmer =>
                        farmer.schemes?.includes(scheme.scheme_id.toString())
                    ).length}
                </button>
            )
        },
        {
            key: 'NotBenefited',
            label: 'Not Benefited',
            render: () => (
                <button
                    onClick={handleNotBenefitedClick}
                    className="hover:underline cursor-pointer"
                >
                    {datafarmers.filter(farmer =>
                        !schemeIds.some(id => farmer.schemes?.includes(id))
                    ).length}
                </button>
            )
        }
    ];

    // Fetch data functions remain same
    const fetchData = async () => {
        try {
            const response = await fetch('/api/usercategorycrud');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchDataschems = async () => {
        try {
            const response = await fetch('/api/schemescrud');
            const result = await response.json();
            setDataschems(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchDatafarmers = async () => {
        try {
            const response = await fetch('/api/farmers');
            const result = await response.json();
            setDatafarmers(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchDatafarmers();
        fetchDataschems();
    }, []);

    return (
        <div>
            <Simpletableshowdata
                data={matches}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1"></div>
                    </div>
                }
                columns={columns}
                title="Scheme Beneficiaries"
                filterOptions={[]}
                searchKey="scheme_name"
                rowsPerPage={5}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-auto">
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
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IFR holders
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Adivasi
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vanksetra
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredFarmers.map((farmer) => (
                                            <tr key={farmer.farmer_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.adivasi}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.vanksetra}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SchemesDashboardcounting
