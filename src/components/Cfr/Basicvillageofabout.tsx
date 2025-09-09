"use client";

import React, { useState } from 'react';
import { Column } from "../tables/tabletype";
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import CustomModel from '@/common/CustomModel';
import ImagePreviewModal from '@/common/ImagePreviewModal';
import KMLMapButton from '../common/KMLMapButton';
import KMLMapdata from '../common/KMLMapdata';

interface Props {
  serverData: basicdetailsofvillagetype[];
}

const Basicvillageofabout: React.FC<Props> = ({ serverData }) => {
  const [data] = useState<basicdetailsofvillagetype[]>(serverData || []);
  const [selectedVillage, setSelectedVillage] = useState<basicdetailsofvillagetype | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Image preview states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null);


  const sortedData = React.useMemo(() => {
    const hasKml = (v: basicdetailsofvillagetype) =>
      !!v.kmlfile && String(v.kmlfile).trim() !== '';
    return [...data].sort((a, b) => (hasKml(b) ? 1 : 0) - (hasKml(a) ? 1 : 0));
  }, [data]);
  const handleVillageClick = (villageData: basicdetailsofvillagetype) => {
    setSelectedVillage(villageData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVillage(null);
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setSelectedImage({ url: imageUrl, title });
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
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
    { label: 'जिल्हा', value: 'नंदुरबार ', unit: '' },
    { label: 'ग्रामसभा अमलबाजवणी यंत्रणा घोषित झाले आहे का', value: village.cfr_boundary_map || '-', unit: '' },
    { label: 'कक्ष क्र', value: village.room_number || '-', unit: '' },
    { label: 'एकूण CFR क्षेत्र', value: village.total_cfr_area, unit: 'हेक्टर आर' },
    { label: 'प्रमाणपत्र क्रमांक', value: village.certificate_no || '-', unit: '' },
    { label: 'सामूहिक वन हक्क मिळाल्याची तारीख', value: formatDate(village.date), unit: '' },
    { label: 'चतु:सिमा', value: `${village.north} | ${village.east} | ${village.west} | ${village.south}`, unit: '' },
    { label: 'बँक खाते तपशील', value: village.bankname || '-', unit: '' },
    { label: 'खाते नंबर ', value: village.accountno || '-', unit: '' },
    { label: 'IFSC ', value: village.ifsc || '-', unit: '' },
    { label: 'सामुहिक वन हक्क संवर्धन व व्यवस्थापन आराखडा पूर्ण आहे का ?', value: village.samuhik, unit: '' },
    { label: 'आराखड्याला ग्रामसभेने मंजुरी दिली आहे का ?', value: village.aarakhdaylagramsabhe, unit: '' },
    { label: 'आराखड्याला तालुका कन्व्हर्जन समितीने मान्यता दिली आहे का ?', value: village.aarakhdyalataluka, unit: '' },
    { label: 'आराखड्याला जिल्हा कन्व्हर्जन समितीने मान्यता दिली आहे का ?', value: village.aarakhdayakajilha, unit: '' },
    { label: 'PAN ', value: village.pan || '-', unit: '' },
    { label: 'TAN ', value: village.tan || '-', unit: '' },
    { label: 'GST ', value: village.gst || '-', unit: '' },
    { label: 'DSC info', value: village.dsc || '-', unit: '' },
    { label: 'Total no of IFR Approved/ pending in CFR', value: village.totalifrapp, unit: '' },
    { label: 'Total No. IFR Area in CFR', value: village.totalnoifrarea, unit: '' },
    { label: 'Remaining Area', value: village.remainingarea, unit: '' },
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
    },
    {
      key: 'kml',
      label: 'KML',
      accessor: 'kmlfile',
      render: (data) =>
        data.kmlfile ? (
          <KMLMapdata
            kmlFile={`/kml/${data.kmlfile}`}
            title="Open KML in new tab"
          />
        ) : null
    }
  ];

  return (
    <div>
      <Simpletableshowdata
        data={sortedData}
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
          // title={`सामुहीक वनहक्क समिती ${selectedVillage.village_name} क्षेत्रातील माहिती`}
          title={`सामूहिक वनहक्क व्यवस्थापन समिती (CFRMC), ${selectedVillage.village_name}`}
          isFullScreen={true}
        >
          <div className="w-full max-w-5xl mx-auto px-2 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Village Details */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden h-[960px] overflow-scroll">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">गाव तपशील</h2>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {getVillageModalData(selectedVillage).map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-start">
                        <div className="w-full sm:w-1/4 text-gray-700 font-semibold text-base mb-1 sm:mb-0">
                          {item.label}:
                        </div>
                        <div className="w-full sm:w-2/3 text-gray-900 text-base space-y-1">
                          {item.label === 'चतु:सिमा'
                            ? item.value.split(' | ').map((dir, idx2) => <div key={idx2}>{dir}</div>)
                            : item.value}
                          {item.unit && <span className="text-gray-500 ml-1">{item.unit}</span>}
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
                      <img
                        src={`${selectedVillage.photo ? `/images/GIS/${selectedVillage.photo}` : '/images/GIS/images.png'}  `}
                        alt="CFR फलक फोटो"
                        className="object-cover rounded max-h-36 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"

                        onClick={() => handleImageClick(`/images/GIS/${selectedVillage.photo}`, "CFR फलक फोटो")}

                      />

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

                      <img

                        src={`${selectedVillage.certificate_img ? `/images/cfrcertificate/${selectedVillage.certificate_img}` : '/images/GIS/images.png'}  `}
                        alt="CFR प्रमाणपत्र"
                        className="h-36 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        onClick={() => handleImageClick(`/images/cfrcertificate/${selectedVillage.certificate_img}`, "CFR प्रमाणपत्र")}

                      />
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
                      <table className="w-full table-fixed border border-gray-300 text-[12px] text-nowrap">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="w-20 border border-gray-300 px-2 py-1 text-center">अ.न.</th>
                            <th className="border border-gray-300 px-2 py-1 text-center w-32">सभासदाचे नाव</th>
                            <th className="w-40 border border-gray-300 px-2 py-1 text-center w-5">पद</th>
                            <th className="border border-gray-300 px-2 py-1text-center">संपर्क क्र</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sabhasadRows.map((r, idx) => (
                            <tr key={idx} className="odd:bg-white even:bg-gray-50">
                              <td className="border border-gray-300 px-2 py-1">{r.no}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{r.name}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{r.pad}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">-</td>
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
                {selectedVillage?.kmlfile ? (
                  <KMLMapButton
                    kmlFile={`/kml/${selectedVillage.kmlfile}`}
                    title="Open KML in new tab"
                  />
                ) : (
                  <div className="text-sm text-gray-500">KML not available</div>
                )}
              </div>
            </div>
          </div>
        </CustomModel>
      )}

      {/* Dedicated Image Preview Modal */}
      {selectedImage && (
        <ImagePreviewModal
          isOpen={isImageModalOpen}
          onClose={handleCloseImageModal}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          alt={selectedImage.title}
        />
      )}
    </div>
  );
};

export default Basicvillageofabout;
