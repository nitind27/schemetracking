"use client";

import { useState } from 'react';
import { Column } from "../tables/tabletype";
import React from 'react';
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Modal } from '../ui/modal';
import { useModal } from '@/hooks/useModal';

interface Props {
    serverData: basicdetailsofvillagetype[];
}

const Basicvillageofabout: React.FC<Props> = ({ serverData }) => {
    const [data] = useState<basicdetailsofvillagetype[]>(serverData || []);
    const [selectedVillage, setSelectedVillage] = useState<basicdetailsofvillagetype | null>(null);
    const { isOpen, openModal, closeModal } = useModal();

    const handleVillageClick = (villageData: basicdetailsofvillagetype) => {
        setSelectedVillage(villageData);
        openModal();
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

            {/* Village Details Modal */}
            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                className="max-w-4xl p-6 lg:p-8"
                isFullscreen={false}
            >
                {selectedVillage && (
                    <div className="space-y-6 h-96 overflow-y-auto">
                        <div className="border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {selectedVillage.village_name} - गाव तपशील
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Complete village information and CFR details
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 pb-2">
                                    मूलभूत माहिती
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">तालुका:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.taluka_name}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">ग्रामपंचायत:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.gp_name}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">गाव:</span>
                                        <span className="text-gray-900 dark:text-white font-semibold">{selectedVillage.village_name}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">एकूण CFR क्षेत्र:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.total_cfr_area}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CFR Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 pb-2">
                                    CFR तपशील
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">खोली क्रमांक:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.room_number}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">प्रमाणपत्र क्रमांक:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.certificate_no}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">दिनांक:</span>
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.date}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">स्थिती:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            selectedVillage.status === 'Active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {selectedVillage.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 pb-2">
                                अतिरिक्त तपशील
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">CFRMC तपशील:</span>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <span className="text-gray-900 dark:text-white">{selectedVillage.cfrmc_details || 'No details available'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">बँक तपशील:</span>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <span className="text-gray-900 dark:text-white">{selectedVillage.bank_details || 'No details available'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">CFR सीमा नकाशा:</span>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.cfr_boundary_map || 'No map available'}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">CFR काम माहिती:</span>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        <span className="text-gray-900 dark:text-white">{selectedVillage.cfr_work_info || 'No work information available'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                            >
                                बंद करा
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Basicvillageofabout;