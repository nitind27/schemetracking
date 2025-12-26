"use client";

import React, { useState } from 'react';
import { Column } from "../tables/tabletype";
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';
// import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import CustomModel from '@/common/CustomModel';
import ImagePreviewModal from '@/common/ImagePreviewModal';
import KMLMapButton from '../common/KMLMapButton';
import KMLMapdata from '../common/KMLMapdata';
import CFRStatusSummary from './CFRStatusSummary';
import { EnhancedVillageTable } from '../tables/EnhancedVillageTable';

import Ifrgis from '../farmersdata/Ifrgis';

interface Sabhasad {
  id?: number | string;
  name?: string;
  position?: string;
  Position?: string;
  photo?: string;
  contact_number?: string;
}

interface Props {
  serverData: basicdetailsofvillagetype[];
}
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

  // Normalize sabhasad data to an array
  // Normalize sabhasad data to an array
   // Normalize sabhasad data to an array
  // Normalize sabhasad data to an array
  const sabhasadList = React.useMemo<Sabhasad[]>(() => {
    const raw = selectedVillage?.sabhasad_array as unknown;
    if (!raw) return [] as Sabhasad[];
    const s = String(raw).trim();
    try {
      // Case 1: already an array string -> parse directly
      if (s.startsWith('[') && s.endsWith(']')) {
        const arr = JSON.parse(s) as unknown;
        return Array.isArray(arr) ? (arr as Sabhasad[]) : [];
      }
      // Case 2: single object string -> wrap to array
      if (s.startsWith('{') && s.endsWith('}')) {
        const obj = JSON.parse(s) as unknown;
        return [obj as Sabhasad];
      }
      // Case 3: comma-joined objects without brackets -> wrap and parse
      if (s.includes('},{') || (s.includes('},"{') || s.includes('},"{'))) {
        const arr = JSON.parse(`[${s}]`) as unknown;
        return Array.isArray(arr) ? (arr as Sabhasad[]) : [];
      }
    } catch { }
    return [] as Sabhasad[];
  }, [selectedVillage]);
  console.log('sabhasadList', sabhasadList);
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


  const columns: Column<basicdetailsofvillagetype>[] = [
    {
      key: 'taluka',
      label: 'Taluka',
      accessor: 'taluka_name',
      render: (data) => <span className="font-medium">{data.taluka_name}</span>
    },
    {
      key: 'grampanchayat',
      label: 'Grampanchayat',
      accessor: 'gp_name',
      render: (data) => <span className="font-medium">{data.gp_name}</span>
    },
    {
      key: 'village',
      label: 'Village',
      accessor: 'village_name',
      render: (data) => (
        <button
          onClick={() => handleVillageClick(data)}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors duration-200 hover:bg-blue-50 px-2 py-1 rounded"
        >
          {data.village_name}
        </button>
      )
    },
    {
      key: 'cfr_area',
      label: 'CFR Area (Hectares)',
      accessor: 'total_cfr_area',
      render: (data) => <span className="text-green-600 font-semibold">{data.total_cfr_area}</span>
    },
    {
      key: 'certificate',
      label: 'Certificate No.',
      accessor: 'certificate_no',
      render: (data) => <span className="text-gray-700">{data.certificate_no || 'N/A'}</span>
    },
    {
      key: 'kml',
      label: 'KML Map',
      accessor: 'kmlfile',
      render: (data) =>
        data.kmlfile ? (
          <KMLMapdata
            kmlFile={`/kml/${data.kmlfile}`}
            title="Open KML in new tab"
          />
        ) : (
          <span className="text-gray-400 text-sm">No KML</span>
        )
    }
  ];

  return (
    <div>
      <div className='mb-4'>
        <CFRStatusSummary />
      </div>
      
      <EnhancedVillageTable
        data={sortedData}
        columns={columns}
      
        searchKey="village_name"
        onVillageClick={handleVillageClick}
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
          <div className="w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Left: Village Details */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden h-[960px] overflow-scroll">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">गाव तपशील</h2>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {getVillageModalData(selectedVillage).map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between">
                        <div className="w-full sm:w-1/2 text-gray-700 font-semibold text-base mb-1 sm:mb-0  whitespace-nowrap">
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
                         {/* Right: Images */}
                         <div className="space-y-3">
                {/* Two inline cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CFR Map */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-gray-800">CFR फलक फोटो</h2>
                    </div>
                    <div className="p-4">
                      <div className="rounded-lg h-40 flex items-center justify-center bg-gray-100 overflow-hidden">
                        <img
                          src={`${selectedVillage.photo ? `https://fra.weclocks.online/api/uploadsvillage/${selectedVillage.photo}` : '/images/GIS/images.png'}`}
                          alt="CFR फलक फोटो"
                          className="object-cover rounded max-h-36 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
                          onClick={() => handleImageClick(`https://fra.weclocks.online/api/uploadsvillage/${selectedVillage.photo}`, "CFR फलक फोटो")}
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
                      <div className="rounded-lg h-40 flex items-center justify-center bg-gray-100 overflow-hidden">
                        <img
                          src={`${selectedVillage.certificate_img ? `https://fra.weclocks.online/api/uploadsvillagecertificate/${selectedVillage.certificate_img}` : '/images/GIS/images.png'}`}
                          alt="CFR प्रमाणपत्र"
                          className="h-36 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity duration-200"
                          onClick={() => handleImageClick(`https://fra.weclocks.online/api/uploadsvillagecertificate/${selectedVillage.certificate_img}`, "CFR प्रमाणपत्र")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sabha Table (below the two cards) */}
                <div className="bg-white rounded-lg shadow border border-gray-200 mt-4 ">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">सभासद</h2>
                  </div>
                  {selectedVillage?.tharav && (
              <div className="flex flex-row gap-2">
               
                <div className="p-4 flex justify-center items-center">
                  {selectedVillage.tharav.toLowerCase().endsWith('.pdf') ? (
                    <a
                      href={`https://fra.weclocks.online/api/uploadsvillagetharav/${selectedVillage.tharav}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ग्रामसभेची ठराव 
                    </a>
                  ) : (
                    <a
                      href={`https://fra.weclocks.online/api/uploadsvillagetharav/${selectedVillage.tharav}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ग्रामसभेची ठराव 
                    </a>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {selectedVillage.prociding.toLowerCase().endsWith('.pdf') ? (
                    <a
                      href={`https://fra.weclocks.online/api/uploadsvillagetharav/${selectedVillage.prociding}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ग्रामसभेची कार्यवाही
                    </a>
                  ) : (
                    <a
                    href={`https://fra.weclocks.online/api/uploadsvillagetharav/${selectedVillage.prociding}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ग्रामसभेची कार्यवाही
                  </a>
                  )}
                </div>
              </div>
            )}
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed border border-gray-300 text-[12px] whitespace-nowrap">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="w-20 border border-gray-300 px-2 py-1 text-center">अ.न.</th>
                            <th className="border border-gray-300 px-2 py-1 text-center">फोटो</th>
                            <th className="w-32 border border-gray-300 px-2 py-1 text-center">सभासदाचे नाव</th>
                            <th className="w-40 border border-gray-300 px-2 py-1 text-center">पद</th>
                            <th className="border border-gray-300 px-2 py-1 text-center">संपर्क क्र</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sabhasadList.map((r, idx) => (
                            <tr key={r.id ?? idx} className="odd:bg-white even:bg-gray-50">
                              <td className="border border-gray-300 px-2 py-1 text-center">{idx + 1}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">
                                {r.photo ? (
                                  <img
                                    src={`https://vishalnawle.in/vishalnavle/flutter_api_fra/village_member_profile/${r.photo}`}
                                    alt={r.name || 'सभासद फोटो'}
                                    className="w-10 h-10 object-cover rounded-full mx-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                    onClick={() => handleImageClick(`https://vishalnawle.in/vishalnavle/flutter_api_fra/village_member_profile/${r.photo}`, r.name || 'सभासद फोटो')}
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs">फोटो नाही</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{r.name ?? ''}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{r.Position ?? r.position ?? ''}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{r.contact_number ?? ''}</td>
                              
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tharav Document Card */}
         

            {/* GIS Map Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mt-4 max-w-full mx-full w-full">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">GIS (CFR सिमांकित नकाशा)</h2>
              </div>
              <div className="p-4 flex justify-center items-center">
                {selectedVillage?.kmlfile ? (
                  <KMLMapButton
                    kmlFile={`https://fra.weclocks.online/api/uploadsvillagekml/${selectedVillage.kmlfile}`}
                    title="Open KML in new tab"
                  />
                ) : (
                  <div className="text-sm text-gray-500">KML not available</div>
                )}
              </div>
            </div>
            {/* GIS Map Card - IFR Map */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mt-4 max-w-full mx-full w-full">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">GIS (FRA सिमांकित नकाशा)</h2>
              </div>
              <div className="p-4 flex justify-center items-center">
                {(() => {
                  const coordinates = selectedVillage?.gis
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
                    .filter((coord): coord is { lat: number; lng: number } => coord !== null);

                  return coordinates && coordinates.length > 0 ? (
                    <Ifrgis coordinates={coordinates}  />
                  ) : (
                    <div className="text-sm text-gray-500">GIS data not available</div>
                  );
                })()}
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
