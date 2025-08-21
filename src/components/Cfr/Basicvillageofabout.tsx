"use client";

import { useState } from 'react';
import { Column } from "../tables/tabletype";
import React from 'react';
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import CustomModel from '@/common/CustomModel';

interface Props {
    serverData: basicdetailsofvillagetype[];
}

const Basicvillageofabout: React.FC<Props> = ({ serverData }) => {
    const [data] = useState<basicdetailsofvillagetype[]>(serverData || []);
    const [selectedVillage, setSelectedVillage] = useState<basicdetailsofvillagetype | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleVillageClick = (villageData: basicdetailsofvillagetype) => {
        setSelectedVillage(villageData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedVillage(null);
    };

    // Convert village data to the format needed for the modal with Marathi labels
    const getVillageModalData = (village: basicdetailsofvillagetype) => {
        return [
            { label: 'ग्रामसभा/CFR प्राप्त गाव गाव', value: village.village_name, unit: '' },
            { label: 'ग्रामपंचायत', value: village.gp_name, unit: '' },
            { label: 'तालुका', value: village.taluka_name, unit: '' },
            { label: 'जिल्हा', value: 'नंदुरबार', unit: '' },
            { label: 'ग्रामसभा अंमलबजावणी अधिकार प्राप्त दिनांक', value: village.date || 'उपलब्ध नाही', unit: '' },
            { label: 'प्रमुख भुमी चिन्ह आणि खासरा कक्ष क्रमांकासह पारंपारिक सीमासह सीमांचे वर्णन', value: village.cfr_boundary_map || 'उपलब्ध नाही', unit: '' },
            { label: 'एकूण CFR क्षेत्र', value: village.total_cfr_area, unit: 'हेक्टर आर' },
            { label: 'कक्ष क्रमांक', value: village.room_number || 'उपलब्ध नाही', unit: '' },
            { label: 'प्रमाणपत्र क्रमांक', value: village.certificate_no || 'उपलब्ध नाही', unit: '' },
            { label: 'दिनांक', value: village.date || 'उपलब्ध नाही', unit: '' },
            { label: 'CFRMC माहिती', value: village.cfrmc_details || 'उपलब्ध नाही', unit: '' },
            { label: 'बँक खाते तपशील', value: village.bank_details || 'उपलब्ध नाही', unit: '' },
        ];
    };

    console.log("serverData", serverData);
    
    const columns: Column<basicdetailsofvillagetype>[] = [
        {
            key: 'taluka',
            label: 'Taluka',
            accessor: 'taluka_name',
            render: (data) => <span>{data.taluka_name}</span>
        },
        {
            key: 'grampanchayat',
            label: 'Grampanchayat',
            accessor: 'gp_name',
            render: (data) => <span>{data.gp_name}</span>
        },
        {
            key: 'village',
            label: 'Village',
            accessor: 'village_name',
            render: (data) => (
                <button
                    onClick={() => handleVillageClick(data)}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors duration-200"
                >
                    {data.village_name}
                </button>
            )
        },
        {
            key: 'total_cfr_area',
            label: 'Total CFR Area',
            accessor: 'total_cfr_area',
            render: (data) => <span>{data.total_cfr_area}</span>
        },
        {
            key: 'room_number',
            label: 'Room Number',
            accessor: 'room_number',
            render: (data) => <span>{data.room_number}</span>
        },
        {
            key: 'certificate_no',
            label: 'Certificate No',
            accessor: 'certificate_no',
            render: (data) => <span>{data.certificate_no}</span>
        },
        {
            key: 'date',
            label: 'Date',
            accessor: 'date',
            render: (data) => <span>{data.date}</span>
        },
        {
            key: 'cfrmc_details',
            label: 'CFRMC Details',
            accessor: 'cfrmc_details',
            render: (data) => <span>{data.cfrmc_details}</span>
        },
        {
            key: 'bank_details',
            label: 'Bank Details',
            accessor: 'bank_details',
            render: (data) => <span>{data.bank_details}</span>
        },
        {
            key: 'cfr_boundary_map',
            label: 'CFR Boundary Map',
            accessor: 'cfr_boundary_map',
            render: (data) => <span>{data.cfr_boundary_map}</span>
        },
        {
            key: 'cfr_work_info',
            label: 'CFR Work Info',
            accessor: 'cfr_work_info',
            render: (data) => <span>{data.cfr_work_info}</span>
        },
        {
            key: 'status',
            label: 'Status',
            accessor: 'status',
            render: (data) => <span>{data.status}</span>
        },
    ];

    return (
        <div className="">
            <Simpletableshowdata
                data={data}
                inputfiled={[]}
                columns={columns}
                title="Year"
                filterOptions={[]}
                searchKey="year"
            />

            {/* Full Screen Village Details Modal */}
            {selectedVillage && (
                <CustomModel
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={`सामुहीक वनहक्क समिती ${selectedVillage.village_name} क्षेत्रातील नरेगा कामाचा माहिती`}
                    isFullScreen={true}
                >
                    <div className="space-y-8">
                        {/* Document Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                सामुहीक वनहक्क समिती {selectedVillage.village_name} क्षेत्रातील नरेगा कामाचा माहिती
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Community Forest Rights Committee - NREGA Work Information
                            </p>
                        </div>

                        {/* Main Data Table */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">गाव तपशील</h2>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-4">
                                    {getVillageModalData(selectedVillage).map((item, index) => (
                                        <div key={index} className="flex border-b border-gray-100 pb-4 last:border-b-0">
                                            <div className="w-1/3 pr-4">
                                                <span className="font-semibold text-gray-700 text-lg">
                                                    {item.label}:
                                                </span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-gray-900 text-lg">
                                                    {item.value}
                                                    {item.unit && (
                                                        <span className="text-gray-500 ml-2">
                                                            {item.unit}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CFR Maps Section */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">CFR सिमांकित नकाशा</h2>
                            </div>
                            
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Map 1 */}
                                    <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                                     <img src="/images/GIS/img1.jpg" alt="" />
                                    </div>
                                    
                                    {/* Map 2 */}
                                    <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                                       <img src="/images/GIS/img2.jpg" alt="" />
                                    </div>
                                </div>
                                
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-blue-800 text-sm">
                                        <strong>सूचना:</strong> वरील नकाशे हे {selectedVillage.village_name} गावाच्या CFR क्षेत्राचे सिमांकित नकाशे आहेत. 
                                        यामध्ये पारंपारिक सीमा, भुमी चिन्हे आणि खासरा कक्ष क्रमांक समाविष्ट आहेत.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* GIS Section - Only Image */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">GIS</h2>
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-center">
                                    <div className=" rounded-lg p-4 w-full max-w-4xl h-96 flex items-center justify-center">
                                        <div className="text-center">
                                            {/* <div className="text-gray-500 mb-4">
                                                <svg className="w-32 h-32 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-600 font-medium text-xl">CFR क्षेत्र शिवारफेरी कार्यक्रम</p>
                                            <p className="text-gray-500 mt-2">CFR Area Field Visit Program</p>
                                            <p className="text-xs text-gray-400 mt-4">Powered by NoteCam</p> */}
                                            <img src="/images/GIS/gis.jpg" alt="" className='h-96 '/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">टीप:</h3>
                            <p className="text-blue-700 text-lg">
                                हा दस्तऐवज {selectedVillage.taluka_name} तालुका, {selectedVillage.gp_name} ग्रामपंचायत, 
                                {selectedVillage.village_name} गावाच्या सामुहीक वनहक्क समितीच्या नरेगा कामाची माहिती दर्शवतो.
                            </p>
                        </div>
                    </div>
                </CustomModel>
            )}
        </div>
    );
};

export default Basicvillageofabout;