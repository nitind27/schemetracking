"use client";

import { useState } from 'react';
import { Column } from "../tables/tabletype";
import React from 'react';
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import CustomModel from '@/common/CustomModel';
import KMLMapButton from '../common/KMLMapButton';

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

    // सभासद table data (static for now)
    const sabhasadRows = [
        { no: '१.', name: 'अर्जुन जोरदार पावरा', pad: 'अध्यक्ष' },
        { no: '२.', name: 'राकेश लालसिंग पावरा', pad: 'सचिव' },
        { no: '३.', name: 'अभिष्नी प्रमोद पावरा', pad: 'खजिनदार' },
        { no: '४.', name: 'श्रीमती रचना कळपेश', pad: 'सभासद' },
        { no: '५.', name: 'सुभाष सायसिंग पावरा', pad: 'सभासद' },
        { no: '६.', name: 'रविंद्र इमानवेल पावरा', pad: 'सभासद' },
        { no: '७.', name: 'निता लोटन पावरा', pad: 'सभासद' },
        { no: '८.', name: 'रमेश गुरूज्या पावरा', pad: 'सभासद' },
        { no: '९.', name: 'कळपेश सुकलाल पावरा', pad: 'सभासद' },
        { no: '१०.', name: 'रसिकलाल बोमचा पावरा', pad: 'सभासद' },
        { no: '११.', name: 'संदीप वनकर पावरा', pad: 'सभासद' },
    ];

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
                    <div className="w-full max-w-7xl mx-auto">
                        <div className="space-y-8">
                            {/* Document Title */}


                            {/* Flex Container for Village Details and CFR Maps */}
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Main Data Table */}
                                <div className="lg:w-1/2">
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <h2 className="text-xl font-semibold text-gray-800">गाव तपशील</h2>
                                        </div>

                                        <div className="p-6">
                                            <div className="space-y-4">
                                                {getVillageModalData(selectedVillage).map((item, index) => (
                                                    <div key={index} className="flex border-b border-gray-100 pb-4 last:border-b-0">
                                                        <div className="w-1/3 pr-4">
                                                            <span className="font-semibold text-gray-700 text-base">
                                                                {item.label}:
                                                            </span>
                                                        </div>
                                                        <div className="w-2/3">
                                                            <span className="text-gray-900 text-base">
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
                                </div>

                                {/* Right Side - CFR Maps, GIS, and New Map Card */}
                                <div className="lg:w-1/2 space-y-6">
                                    {/* CFR Maps Section */}
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <h2 className="text-xl font-semibold text-gray-800">CFR सिमांकित नकाशा</h2>
                                        </div>

                                        <div className="p-6">
                                            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                                                <img src="/images/GIS/gismap.jpg" alt="" className="w-full h-full object-cover rounded" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* GIS Section - Only Image */}
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <h2 className="text-xl font-semibold text-gray-800">Geo Tag photos</h2>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-center">
                                                <div className="rounded-lg w-full h-64 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <img src="/images/GIS/gis.jpg" alt="" className='h-64 object-cover rounded' />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Map Card with Icon */}
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <h2 className="text-xl font-semibold text-gray-800">GIS</h2>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-center items-center">
                                                <KMLMapButton
                                                    kmlFile={"/public/kml/Harankhuri CFR.kml"}
                                                    title="Click to open KML file in Google Earth"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* सभासद table (full width; not inside flex) */}
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">सभासद</h2>
                                </div>
                                <div className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-fixed border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="w-20 border border-gray-300 px-3 py-2 text-left">अ.न.</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-left">सभासदाचे नाव</th>
                                                    <th className="w-40 border border-gray-300 px-3 py-2 text-left">पद</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sabhasadRows.map((r, idx) => (
                                                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                                                        <td className="border border-gray-300 px-3 py-2">{r.no}</td>
                                                        <td className="border border-gray-300 px-3 py-2">{r.name}</td>
                                                        <td className="border border-gray-300 px-3 py-2">{r.pad}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </CustomModel>
            )}
        </div>
    );
};

export default Basicvillageofabout;