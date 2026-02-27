"use client";

import { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Column } from "../tables/tabletype";
import { FarmdersType } from './farmers';
import { Village } from '../Village/village';
import { Taluka } from '../Taluka/Taluka';
import { Schemesdatas } from '../schemesdata/schemes';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import Ifrsmaplocations from './Ifrsmaplocations';
import { Documents } from '../Documentsdata/documents';

interface FarmersdataProps {
  data: FarmdersType[];
  datavillage: Village[];
  datataluka: Taluka[];
  dataschems: Schemesdatas[];
  documents: Documents[];
}

// Excel Download Button Component
interface ExcelDownloadButtonProps {
  data: FarmdersType[];
  datavillage: Village[];
  datataluka: Taluka[];
  dataschems: Schemesdatas[];
  documents: Documents[];
  filteredCount: number;
  totalCount: number;
}

const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({
  data,
  datavillage,
  datataluka,
  dataschems,
  documents,
  filteredCount,
  totalCount
}) => {
  const handleDownload = () => {
    try {
      // Prepare data for Excel
      const excelData = data.map((farmer, index) => {
        const parsed = parseFarmerRecord(farmer.farmer_record);
        
        // Get village name
        const village = datavillage.find(v => v.village_id === Number(farmer.village_id));
        const villageName = village ? village.name : 'N/A';
        
        // Get taluka name
        const taluka = datataluka.find(t => t.taluka_id === Number(farmer.taluka_id));
        const talukaName = taluka ? taluka.name : 'N/A';
        
        // Get scheme name
        const scheme = dataschems.find(s => s.scheme_id === Number(farmer.schemes));
        const schemeName = scheme ? scheme.scheme_name : 'N/A';
        
        // Get document names
        const segments = typeof farmer.documents === "string" ? farmer.documents.split('|') : [];
        const docIds = segments.map(seg => seg.split('--')[0]).filter(Boolean);
        const docNames = docIds
          .map(id => {
            const doc = documents.find(d => String(d.id) === id);
            return doc ? doc.document_name : null;
          })
          .filter(Boolean)
          .join(', ');
        
        // Mask Aadhaar number (show last 4 digits only)
        const maskAadhaar = (aadhaar: string): string => {
          if (!aadhaar || aadhaar.trim() === '') return '';
          const cleaned = aadhaar.trim().replace(/\s+/g, '');
          if (cleaned.length !== 12) return aadhaar;
          return '*'.repeat(8) + cleaned.slice(-4);
        };

        return {
          'Sr. No.': index + 1,
          'Name': parsed.name || 'N/A',
          'Adivasi': parsed.adivasi || 'N/A',
          'Village': villageName,
          'Taluka': talukaName,
          'Gat No': parsed.gatNo || 'N/A',
          'Vanksetra': parsed.vanksetra || 'N/A',
          'Nivas Seti': parsed.nivasSeti || 'N/A',
          'Aadhaar No': maskAadhaar(parsed.aadhaarNo || ''),
          'Contact No': parsed.contactNo || 'N/A',
          'Email': parsed.email || 'N/A',
          'Kisan ID': parsed.kisanId || 'N/A',
          'DOB': parsed.dob || 'N/A',
          'Gender': parsed.gender || 'N/A',
          'Documents': docNames || 'N/A',
          'Scheme': schemeName,
          'Compartment Number': parsed.compartmentNumber || 'N/A',
          'Schedule J': parsed.scheduleJ || 'N/A',
          'Claim ID': parsed.claimId || 'N/A',
          'Created At': parsed.createdAt || 'N/A',
          'Updated At': parsed.updatedAt || 'N/A',
          'Remarks': parsed.remarks || 'N/A',
          'IFR Mayat': parsed.ifrMayat || 'N/A',
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 8 },  // Sr. No.
        { wch: 25 }, // Name
        { wch: 10 }, // Adivasi
        { wch: 20 }, // Village
        { wch: 20 }, // Taluka
        { wch: 15 }, // Gat No
        { wch: 15 }, // Vanksetra
        { wch: 15 }, // Nivas Seti
        { wch: 20 }, // Aadhaar No
        { wch: 15 }, // Contact No
        { wch: 30 }, // Email
        { wch: 15 }, // Kisan ID
        { wch: 15 }, // DOB
        { wch: 10 }, // Gender
        { wch: 30 }, // Documents
        { wch: 25 }, // Scheme
        { wch: 20 }, // Compartment Number
        { wch: 15 }, // Schedule J
        { wch: 15 }, // Claim ID
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
        { wch: 30 }, // Remarks
        { wch: 15 }, // IFR Mayat
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'IFR Holders');

      // Generate filename with current date
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const filename = `IFR_Holders_${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Excel डाउनलोड करते समय त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
      title="Excel डाउनलोड करा"
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      
      {/* Icon with animation */}
      <svg 
        className="w-5 h-5 group-hover:animate-bounce" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      
      <span className="text-sm sm:text-base font-semibold">
        Excel डाउनलोड
      </span>
      
      {/* Badge showing count */}
      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
        {filteredCount}/{totalCount}
      </span>
      
      {/* Tooltip on hover */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {filteredCount} फिल्टर केलेले रेकॉर्ड डाउनलोड करा
      </div>
    </button>
  );
};

// Document Modal Component
interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Documents[];
  documentIds: string[];
  farmerName: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ 
  isOpen, 
  onClose, 
  documents, 
  documentIds,
  farmerName 
}) => {
  if (!isOpen) return null;

  // Find full document objects from IDs
  const selectedDocs = documentIds
    .map(id => documents.find(doc => String(doc.id) === id))
    .filter((doc): doc is Documents => doc !== undefined);

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all">
          {/* Header with gradient */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  दस्तऐवज तपशील
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {farmerName} - {selectedDocs.length} दस्तऐवज
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Document List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {selectedDocs.length > 0 ? (
              <div className="space-y-4">
                {selectedDocs.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 overflow-hidden"
                  >
                    {/* Decorative gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
                    
                    <div className="relative p-4">
                      <div className="flex items-start gap-4">
                        {/* Document Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>

                        {/* Document Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {doc.document_name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            दस्तऐवज क्रमांक: #{index + 1}
                          </p>
                          
                          {/* Document Preview Placeholder */}
                          <div className="mt-3 flex items-center gap-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              उपलब्ध
                            </span>
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 group/btn">
                              <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              पूर्वावलोकन
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group/btn" title="डाउनलोड करा">
                            <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 group/btn" title="शेअर करा">
                            <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur-xl opacity-20"></div>
                  <svg className="relative w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-600">कोणतेही दस्तऐवज आढळले नाहीत</p>
                <p className="text-sm text-gray-500 mt-2">No documents found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to parse farmer_record string
const parseFarmerRecord = (farmerRecord: string | null | undefined): {
  name: string;
  adivasi: string;
  gatNo: string;
  vanksetra: string;
  nivasSeti: string;
  aadhaarNo: string;
  contactNo: string;
  email: string;
  kisanId: string;
  dob: string;
  gender: string;
  profilePhoto: string;
  aadhaarPhoto: string;
  compartmentNumber: string;
  scheduleJ: string;
  claimId: string;
  createdAt: string;
  updatedAt: string;
  remarks: string;
  voiceAudio: string;
  ifrMayat: string;
} => {
  if (!farmerRecord) {
    return {
      name: '',
      adivasi: '',
      gatNo: '',
      vanksetra: '',
      nivasSeti: '',
      aadhaarNo: '',
      contactNo: '',
      email: '',
      kisanId: '',
      dob: '',
      gender: '',
      profilePhoto: '',
      aadhaarPhoto: '',
      compartmentNumber: '',
      scheduleJ: '',
      claimId: '',
      createdAt: '',
      updatedAt: '',
      remarks: '',
      voiceAudio: '',
      ifrMayat: ''
    };
  }

  const farmerRecordArray = farmerRecord.split('|');
  
  return {
    name: (farmerRecordArray[0] || '').trim(),
    adivasi: (farmerRecordArray[1] || '').trim(),
    gatNo: (farmerRecordArray[2] || '').trim(),
    vanksetra: (farmerRecordArray[3] || '').trim(),
    nivasSeti: (farmerRecordArray[4] || '').trim(),
    aadhaarNo: (farmerRecordArray[5] || '').trim(),
    contactNo: (farmerRecordArray[6] || '').trim(),
    email: (farmerRecordArray[7] || '').trim(),
    kisanId: (farmerRecordArray[8] || '').trim(),
    dob: (farmerRecordArray[9] || '').trim(),
    gender: (farmerRecordArray[10] || '').trim(),
    profilePhoto: (farmerRecordArray[11] || '').trim(),
    aadhaarPhoto: (farmerRecordArray[12] || '').trim(),
    compartmentNumber: (farmerRecordArray[13] || '').trim(),
    scheduleJ: (farmerRecordArray[14] || '').trim(),
    claimId: (farmerRecordArray[15] || '').trim(),
    createdAt: (farmerRecordArray[16] || '').trim(),
    updatedAt: (farmerRecordArray[17] || '').trim(),
    remarks: (farmerRecordArray[18] || '').trim(),
    voiceAudio: (farmerRecordArray[19] || '').trim(),
    ifrMayat: (farmerRecordArray[20] || '').trim()
  };
};

const Farmersdata: React.FC<FarmersdataProps> = ({
  data,
  datavillage,
  datataluka,
  dataschems,
  documents,
}) => {
  const [filters, setFilters] = useState({
    talukaId: null as string | null,
    villageId: null as string | null,
    categoryName: null as string | null,
    aadhaarwith: null as string | null
  });

  const [selectedTaluka, setSelectedTaluka] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  
  // Document Modal State
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    documentIds: string[];
    farmerName: string;
  }>({
    isOpen: false,
    documentIds: [],
    farmerName: ''
  });

  useEffect(() => {
    const talukaId = sessionStorage.getItem('taluka_id');
    const villageId = sessionStorage.getItem('village_id');
    const categoryName = sessionStorage.getItem('category_name');
    const aadhaarwith = sessionStorage.getItem('aadharcount');

    setFilters({
      talukaId,
      villageId,
      categoryName,
      aadhaarwith
    });

    setSelectedTaluka(talukaId || '');
    setSelectedVillage(villageId || '');
  }, []);

  const talukaOptions = useMemo(() =>
    datataluka.map((taluka) => ({
      label: taluka.name,
      value: taluka.taluka_id.toString()
    })),
    [datataluka]
  );

  const villageOptions = useMemo(() => {
    if (!selectedTaluka) return [];
    
    const villagesInTaluka = datavillage.filter(village => village.taluka_id == selectedTaluka);
    
    return villagesInTaluka
      .map(village => {
        const totalCount = data.filter(farmer => farmer.village_id === village.village_id.toString()).length;
        return {
          label: `${village.marathi_name} (${totalCount})`,
          value: village.village_id.toString(),
          count: totalCount
        };
      })
      .filter(village => village.count > 0)
      .map(village => ({
        label: village.label,
        value: village.value
      }));
  }, [datavillage, selectedTaluka, data]);
  
  const filteredFarmers = useMemo(() => {
    let result = data;

    if (
      selectedTaluka === '0' &&
      selectedVillage === '0' &&
      filters.talukaId === '0' &&
      filters.villageId === '0'
    ) {
      return result;
    }

    if (!selectedTaluka && !selectedVillage) {
      result = result.filter(
        (f) =>
          f.taluka_id === filters.talukaId &&
          f.village_id === filters.villageId
      );
    }
    if (selectedTaluka && filters.aadhaarwith == '0') {
      result = result.filter(
        (f) => f.taluka_id == selectedTaluka
      );
    }
    
    if (selectedTaluka && filters.aadhaarwith != '1' && filters.aadhaarwith != '0') {
      result = result.filter(
        (f) => f.taluka_id === selectedTaluka
      );
    }

    if (selectedTaluka && filters.aadhaarwith == '1') {
      result = result.filter(
        (f) =>
          f.taluka_id === selectedTaluka &&
          parseFarmerRecord(f.farmer_record)?.aadhaarNo !== ''
      );
    }
    if (selectedVillage) {
      result = result.filter(
        (f) =>
          f.village_id === selectedVillage &&
          (filters.aadhaarwith !== '1' || parseFarmerRecord(f.farmer_record)?.aadhaarNo !== '')
      );
    }

    return result;
  }, [data, filters, selectedTaluka, selectedVillage]);

  const columns: Column<FarmdersType>[] = [
    {
      key: 'name',
      label: 'Name',
      accessor: 'name',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.name}</span>;
      }
    },
    {
      key: 'adivasi',
      label: 'Adivasi',
      accessor: 'adivasi',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.adivasi}</span>;
      }
    },
    {
      key: 'village_id',
      label: 'Village',
      accessor: 'village_id',
      render: (item) => (
        <span>
          {datavillage.find(v => v.village_id === Number(item.village_id))?.name}
        </span>
      )
    },
    {
      key: 'taluka_id',
      label: 'Taluka',
      accessor: 'taluka_id',
      render: (item) => (
        <span>
          {datataluka.find(t => t.taluka_id === Number(item.taluka_id))?.name}
        </span>
      )
    },
    {
      key: 'gat_no',
      label: 'Gat No',
      accessor: 'gat_no',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.gatNo}</span>;
      }
    },
    {
      key: 'vanksetra',
      label: 'Vanksetra',
      accessor: 'vanksetra',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.vanksetra}</span>;
      }
    },
    {
      key: 'nivas_seti',
      label: 'Nivas Seti',
      accessor: 'nivas_seti',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.nivasSeti}</span>;
      }
    },
    {
      key: 'aadhaar_no',
      label: 'Aadhaar No',
      accessor: 'aadhaar_no',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        const aadhaarNo = parsed.aadhaarNo || '';
        
        // Show last 4 digits, rest as *
        const maskedAadhaar = aadhaarNo 
          ? '**** **** ' + aadhaarNo.slice(-4)
          : '';
          
        return <span>{maskedAadhaar}</span>;
      }
    },
    
    {
      key: 'contact_no',
      label: 'Contact No',
      accessor: 'contact_no',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.contactNo}</span>;
      }
    },
    {
      key: 'email',
      label: 'Email',
      accessor: 'email',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.email}</span>;
      }
    },
    {
      key: 'kisan_id',
      label: 'Kisan Id',
      accessor: 'kisan_id',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.kisanId}</span>;
      }
    },
    {
      key: 'dob',
      label: 'DOB',
      accessor: 'dob',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.dob}</span>;
      }
    },
    {
      key: 'gender',
      label: 'Gender',
      accessor: 'genger',
      render: (item) => {
        const parsed = parseFarmerRecord(item.farmer_record);
        return <span>{parsed.gender}</span>;
      }
    },
    {
      key: 'documents',
      label: 'Documents',
      accessor: 'documents',
      render: (item) => {
        const segments = typeof item.documents === "string" ? item.documents.split('|') : [];
        const docIds = segments.map(seg => seg.split('--')[0]).filter(Boolean);
        // const docNames = docIds
        //   .map(id => {
        //     const doc = documents.find(d => String(d.id) === id);
        //     return doc ? doc.document_name : null;
        //   })
        //   .filter(Boolean);
        
        const parsed = parseFarmerRecord(item.farmer_record);
        const farmerName = parsed.name || 'Unknown';

        return (
          <span 
            className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition-all duration-200 font-medium"
            onClick={() => setDocumentModal({
              isOpen: true,
              documentIds: docIds,
              farmerName: farmerName
            })}
          >
            View Doc ({docIds.length})
          </span>
        );
      }
    },
    {
      key: 'schemes',
      label: 'Schemes',
      accessor: 'schemes',
      render: (item) => (
        <span>
          {dataschems.find(s => s.scheme_id === Number(item.schemes))?.scheme_name}
        </span>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (item) => {
        const coordinates = item.gis
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
          .filter((coord) => coord !== null);

        return (
          <>
            {coordinates && coordinates.length > 0 && (
              <Ifrsmaplocations coordinates={coordinates as { lat: number; lng: number }[]} />
            )}
          </>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header with Title and Excel Download Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-md">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IFR Holders</h2>
          <p className="text-sm text-gray-600 mt-1">
            एकूण रेकॉर्ड: {data.length} | फिल्टर केलेले: {filteredFarmers.length}
          </p>
        </div>
        
        {/* Excel Download Button */}
        <ExcelDownloadButton
          data={filteredFarmers}
          datavillage={datavillage}
          datataluka={datataluka}
          dataschems={dataschems}
          documents={documents}
          filteredCount={filteredFarmers.length}
          totalCount={data.length}
        />
      </div>

      {/* Main Table Component */}
      <Simpletableshowdata
        key={JSON.stringify(filteredFarmers)}
        data={filteredFarmers}
        inputfiled={[]}
        columns={columns}
        title=""
        filterOptions={[
          {
            label: "Taluka",
            options: talukaOptions,
            value: selectedTaluka,
            onChange: (value) => {
              setSelectedTaluka(value);
              setSelectedVillage('');
            }
          },
          {
            label: "Village",
            options: villageOptions,
            value: selectedVillage,
            onChange: (value) => setSelectedVillage(value)
          }
        ]}
        submitbutton={[]}
      />

      {/* Document Modal */}
      <DocumentModal
        isOpen={documentModal.isOpen}
        onClose={() => setDocumentModal({ isOpen: false, documentIds: [], farmerName: '' })}
        documents={documents}
        documentIds={documentModal.documentIds}
        farmerName={documentModal.farmerName}
      />
    </div>
  );
};

export default Farmersdata;