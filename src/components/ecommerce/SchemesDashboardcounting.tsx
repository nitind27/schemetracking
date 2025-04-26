"use client"
import React, { useEffect, useState } from 'react'
import { UserCategory } from '../usercategory/userCategory';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';
import SchemesDataModel from '../example/ModalExample/SchemesDataModel';
import { Schemecategorytype } from '../Schemecategory/Schemecategory';
import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';
import { Scheme_year } from '../Yearmaster/yearmaster';
import { Documents } from '../Documentsdata/documents';

interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    yearmaster: Scheme_year[];
    documents: Documents[];
}

const SchemesDashboardcounting = ({ farmersData }: { farmersData: AllFarmersData }) => {
    // const [data, setData] = useState<UserCategory[]>([]);
    const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
    const [dataschemsyear, setDataschemsyear] = useState<Scheme_year[]>([]);
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [datadocuments, setDocumentsdata] = useState<Documents[]>([]);
    const [dataSchemecategory, setDataSchemecategory] = useState<Schemecategorytype[]>([]);
    const [dataSchemesubcategory, setDataSchemesubcategory] = useState<Schemesubcategorytype[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        if (farmersData) {
            // setData(farmersData.users);
            setDataschems(farmersData.schemes);
            setDatafarmers(farmersData.farmers);
            setDataSchemecategory(farmersData.schemescrud)
            setDataSchemesubcategory(farmersData.schemessubcategory)
            setDataschemsyear(farmersData.yearmaster)
            setDocumentsdata(farmersData.documents)
        }
    }, [farmersData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredFarmers]);

    const schemeIds = dataschems.map(scheme => scheme.scheme_id.toString());

    const alldata = datafarmers.filter(farmer => farmer.schemes?.trim() !== "");

    const matches = dataschems.filter(scheme =>
        alldata.some(farmer => farmer.schemes?.includes(scheme.scheme_id.toString()))
    );

    const handleBenefitedClick = (schemeId: string) => {
        const benefitedFarmers = datafarmers.filter(farmer =>
            farmer.schemes?.includes(schemeId)
        );
        setModalTitle(`Benefited IFR holders`);
        setFilteredFarmers(benefitedFarmers);
        setIsModalOpen(true);
    };

    const handleNotBenefitedClick = () => {
        const notBenefited = datafarmers.filter(farmer =>
            !schemeIds.some(id => farmer.schemes?.includes(id))
        );
        setModalTitle('Non-Benefited IFR Holders');
        setFilteredFarmers(notBenefited);
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(filteredFarmers.length / rowsPerPage);
    const paginatedFarmers = filteredFarmers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const columns: Column<Schemesdatas>[] = [
        {
            key: 'scheme_name',
            label: 'Schemes Name',
            accessor: 'scheme_name',
            render: (scheme) => <span> <SchemesDataModel schemeid={scheme.scheme_id} farmername={scheme.scheme_name} datascheme={dataschems} schemescrud={dataSchemecategory} schemessubcategory={dataSchemesubcategory} dataschemsyear={dataschemsyear} datadocuments={datadocuments} /></span>
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
                rowsPerPage={10}
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
                                                Sr.No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IFR holders
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vanksetra
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedFarmers.map((farmer, index) => (
                                            <tr key={farmer.farmer_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.adivasi}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.contact_no || '-'}
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
    )
}

export default SchemesDashboardcounting;
