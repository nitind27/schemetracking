"use client";

import React, { useState } from 'react';
import { Column } from "../tables/tabletype";
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

  function formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'उपलब्ध नाही';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'उपलब्ध नाही';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const getVillageModalData = (village: basicdetailsofvillagetype) => [
    { label: 'ग्रामसभा/CFR प्राप्त गाव', value: village.village_name, unit: '' },
    { label: 'ग्रामपंचायत', value: village.gp_name, unit: '' },
    { label: 'तालुका', value: village.taluka_name, unit: '' },
    { label: 'जिल्हा', value: 'नंदुरबार', unit: '' },
    { label: 'ग्रामसभा अंमलबजावणी अधिकार प्राप्त दिनांक', value: formatDate(village.date) || 'उपलब्ध नाही', unit: '' },
    { label: 'प्रमुख भुमी चिन्ह आणि खासरा कक्ष क्रमांकासह पारंपारिक सीमासह सीमांचे वर्णन', value: village.cfr_boundary_map && '15,54' || 'उपलब्ध नाही', unit: '' },
    { label: 'एकूण CFR क्षेत्र', value: village.total_cfr_area, unit: 'हेक्टर आर' },
    { label: 'कक्ष क्रमांक', value: village.room_number || 'उपलब्ध नाही', unit: '' },
    { label: 'प्रमाणपत्र क्रमांक', value: village.certificate_no || 'उपलब्ध नाही', unit: '' },
    { label: 'दिनांक', value: formatDate(village.date), unit: '' },
    { label: 'CFRMC माहिती', value: village.cfrmc_details || 'उपलब्ध नाही', unit: '' },
    { label: 'चतु:सिमा', value: village.gp_name || "पूर्व || पश्चिम || उत्तर || दक्षिण ", unit: '' },
    { label: 'बँक खाते तपशील', value: village.bank_details || 'उपलब्ध नाही', unit: '' },
    { label: 'खाते नंबर ', value: village.gp_name && "5481527135" || 'उपलब्ध नाही', unit: '' },
    { label: 'IFSC ', value: village.bank_details && "CBIN0283044" || 'उपलब्ध नाही', unit: '' },
  ];

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
    }
  ];

  return (
    <div>
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
          title={`सामुहीक वनहक्क समिती ${selectedVillage.village_name} क्षेत्रातील माहिती`}
          isFullScreen={true}
        >
          <div className="w-full max-w-5xl mx-auto px-2 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Village Details */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">गाव तपशील</h2>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {getVillageModalData(selectedVillage).map((item, index) => (
                      <div key={index} className="flex border-b border-gray-100 pb-2 last:border-b-0">
                        <div className="w-1/3 pr-2">
                          <span className="font-semibold text-gray-700 text-base">
                            {item.label}:
                          </span>
                        </div>
                        <div className="w-2/3">
                          <span className="text-gray-900 text-base">
                            {item.value}
                            {item.unit && (
                              <span className="text-gray-500 ml-1">
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

              {/* Right: Images */}
              <div className="space-y-3">
                {/* CFR Map */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">CFR फलक फोटो</h2>
                  </div>
                  <div className="p-4">
                    <div className="rounded-lg h-40 flex items-center justify-center bg-gray-100 overflow-hidden">
                      <img src="/images/GIS/gismap.jpg" alt="" className="object-cover rounded max-h-36 w-auto" />
                    </div>
                  </div>
                </div>
                {/* Certificate */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">CFR प्रमाणपत्र</h2>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-center">
                      <img src="/images/GIS/certi.jpeg" alt="" className="h-36 object-cover rounded" />
                    </div>
                  </div>
                </div>
                     {/* Sabha Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mt-4 max-w-3xl mx-auto">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">सभासद</h2>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="w-20 border border-gray-300 px-2 py-1 text-left">अ.न.</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">सभासदाचे नाव</th>
                        <th className="w-40 border border-gray-300 px-2 py-1 text-left">पद</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sabhasadRows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">{r.no}</td>
                          <td className="border border-gray-300 px-2 py-1">{r.name}</td>
                          <td className="border border-gray-300 px-2 py-1">{r.pad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
              </div>
            </div>

       

            {/* GIS Map Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mt-4 max-w-full mx-full w-full">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">GIS (CFR सिमांकित नकाशा)</h2>
              </div>
              <div className="p-4 flex justify-center items-center">
                <KMLMapButton
                  kmlFile={"/kml/Harankhuri CFR.kml"}
                  title="Click to open KML file in Google Earth"
                />
              </div>
            </div>

          </div>
        </CustomModel>
      )}
    </div>
  );
};

export default Basicvillageofabout;
