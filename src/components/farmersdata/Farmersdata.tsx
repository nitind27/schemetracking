"use client";

import { useEffect, useState, useMemo } from 'react';
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
    
    return villagesInTaluka.map(village => {
      const totalCount = data.filter(farmer => farmer.village_id === village.village_id.toString()).length;
      return {
        label: `${village.marathi_name} (${totalCount})`,
        value: village.village_id.toString()
      };
    });
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
        return <span>{parsed.aadhaarNo}</span>;
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
        const docNames = docIds
          .map(id => {
            const doc = documents.find(d => String(d.id) === id);
            return doc ? doc.document_name : null;
          })
          .filter(Boolean);
        return <span>{docNames.join(', ')}</span>;
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
    <div className="">
      <Simpletableshowdata
        key={JSON.stringify(filteredFarmers)}
        data={filteredFarmers}
        inputfiled={[]}
        columns={columns}
        title="IFR Holders"
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
    </div>
  );
};

export default Farmersdata;
