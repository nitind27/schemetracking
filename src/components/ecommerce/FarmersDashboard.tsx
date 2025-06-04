// src/components/ecommerce/FarmersDashboard.tsx
"use client"
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

    const schemeIdss = dataschems?.map(datas => {
        const id = String(datas.scheme_id).replace("1:", "");
        return Number(id);
    });

    // const allfarmersname = datafarmers.filter(data => {
    //     const farmerScheme = String(data.schemes).replace("1:", "");
    //     return schemeIdss.includes(Number(farmerScheme));
    // });
    const allfarmersname = datafarmers?.filter(data => {
        const farmerScheme = String(data.schemes) != "";
        return schemeIdss.includes(Number(farmerScheme));
    });


    const handleBenefitedClick = (schemeId: string) => {
        const benefitedFarmers = dataschems?.filter(schemes =>
            schemeId.includes(schemes.scheme_id.toString())
        );

        setModalTitle(`Benefited Schemes`);
        setFilteredschemes(benefitedFarmers);
        setIsModalOpen(true);
    };

    // const handleNotBenefitedClick = (farmer_id: string) => {

    //     const notBenefited = datafarmers.filter((data) => data.farmer_id == Number(farmer_id)).map((data) => data)
    //     setModalTitle('Non-Benefited Schemes');
    //     setFilteredFarmers(notBenefited);
    //     setIsModalOpen(true);

    // };
    const handleNotBenefitedClickschemes = (farmer_id: string) => {
        const notBenefiteddata = dataschems.filter((data) => data.scheme_id != Number(farmer_id)).map((data) => data)

        setModalTitle('Non-Benefited Schemes');
        setFilteredschemes(notBenefiteddata);
        setIsModalOpen(true);
    };

    const columns: Column<FarmdersType>[] = [
        {
            key: 'scheme_name',
            label: 'IFR holders Name',
            accessor: 'name',
            render: (allfarmersname) => <span > <UserDatamodel farmersid={allfarmersname.farmer_id.toString()} datafarmers={datafarmers} farmername={allfarmersname.name} datavillage={datavillage} datataluka={datataluka} /></span>
        },
        {
            key: 'contactno',
            label: 'Contact No',
            accessor: 'contact_no',
            render: (allfarmersname) => <span >{allfarmersname.contact_no || '-'}</span>
        },
        {
            key: 'Benefited',
            label: 'Benefited',
            render: (allfarmersname) => (
                <button
                    onClick={() => handleBenefitedClick(allfarmersname.schemes.toString())}
                    className="text-blue-700 hover:underline cursor-pointer"
                >
                    {dataschems.filter(farmer =>
                        farmer.scheme_id == Number(allfarmersname.schemes)
                    ).length}
                </button>
            )
        },
        {
            key: 'NotBenefited',
            label: 'Not Benefited',
            render: (allfarmersname) => (
                <button
                    className="hover:underline cursor-pointer"
                    onClick={() => handleNotBenefitedClickschemes(allfarmersname.schemes)}
                >
                    {dataschems.length - dataschems.filter(farmer =>
                        farmer.scheme_id == Number(allfarmersname.schemes)
                    ).length}
                </button>
            )
        },

    ];

    const handleclosemodel = () => {
        setFilteredFarmers([])
        setFilteredschemes([])
        setIsModalOpen(false)
    }

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

                                                Beneficiery
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Applyed
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
                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => handleclosemodel()}
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

export default FarmersDashboard;
