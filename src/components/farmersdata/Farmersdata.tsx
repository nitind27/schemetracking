"use client";

import { useEffect, useState, useMemo } from 'react';

import { Column } from "../tables/tabletype";
import { FarmdersType } from './farmers';
import { Village } from '../Village/village';
import { Taluka } from '../Taluka/Taluka';
import { Schemesdatas } from '../schemesdata/schemes';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';

interface FarmersdataProps {
  data: FarmdersType[];
  datavillage: Village[];
  datataluka: Taluka[];
  dataschems: Schemesdatas[];
}

const Farmersdata: React.FC<FarmersdataProps> = ({
  data,
  datavillage,
  datataluka,
  dataschems,
}) => {
  const [filters, setFilters] = useState({
    talukaId: null as string | null,
    villageId: null as string | null,
    categoryName: null as string | null
  });

  const [selectedTaluka, setSelectedTaluka] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');

  useEffect(() => {
    const talukaId = sessionStorage.getItem('taluka_id');
    const villageId = sessionStorage.getItem('village_id');
    const categoryName = sessionStorage.getItem('category_name');

    setFilters({
      talukaId,
      villageId,
      categoryName,
    });

    // Also set UI filters
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

  const villageOptions = useMemo(() =>
    selectedTaluka
      ? datavillage
        .filter(village => village.taluka_id == selectedTaluka)
        .map(village => ({
          label: village.name,
          value: village.village_id.toString()
        }))
      : [],
    [datavillage, selectedTaluka]
  );

  const filteredFarmers = useMemo(() => {
    let result = data;
    if (selectedTaluka == '0' && selectedVillage == "0" && filters.talukaId == "0" && filters.villageId == "0") {
      return result;
    }
    if (selectedTaluka.length < 0 && selectedVillage.length < 0) {
      result = result.filter(f =>
        f.taluka_id == filters.talukaId &&
        f.village_id == filters.villageId
      );
    }
    // Apply UI filters (these override session filters if changed)
    if (selectedTaluka) {
      result = result.filter(f => f.taluka_id == selectedTaluka);
    }
    if (selectedVillage) {
      result = result.filter(f => f.village_id == selectedVillage);
    }

    return result;
  }, [data, filters, selectedTaluka, selectedVillage]);


  const columns: Column<FarmdersType>[] = [
    {
      key: 'name',
      label: 'Name',
      accessor: 'name',
      render: (item) => <span>{item.name}</span>
    },
    {
      key: 'adivasi',
      label: 'Adivasi',
      accessor: 'adivasi',
      render: (item) => <span>{item.adivasi}</span>
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
      render: (item) => <span>{item.gat_no}</span>
    },
    {
      key: 'vanksetra',
      label: 'Vanksetra',
      accessor: 'vanksetra',
      render: (item) => <span>{item.vanksetra}</span>
    },
    {
      key: 'nivas_seti',
      label: 'Nivas Seti',
      accessor: 'nivas_seti',
      render: (item) => <span>{item.nivas_seti}</span>
    },
    {
      key: 'aadhaar_no',
      label: 'Aadhaar No',
      accessor: 'aadhaar_no',
      render: (item) => <span>{item.aadhaar_no}</span>
    },
    {
      key: 'contact_no',
      label: 'Contact No',
      accessor: 'contact_no',
      render: (item) => <span>{item.contact_no}</span>
    },
    {
      key: 'email',
      label: 'Email',
      accessor: 'email',
      render: (item) => <span>{item.email}</span>
    },
    {
      key: 'kisan_id',
      label: 'Kisan Id',
      accessor: 'kisan_id',
      render: (item) => <span>{item.kisan_id}</span>
    },
    {
      key: 'documents',
      label: 'Documents',
      accessor: 'documents',
      render: (item) => <span>{item.documents}</span>
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
  ];

  return (
    <div className="">
      <Simpletableshowdata
        key={JSON.stringify(filteredFarmers)}
        data={filteredFarmers}
        inputfiled={
          []
        }
        columns={columns}
        title="User Category"
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
        submitbutton={
          []
        }

      />
    </div>
  );
};

export default Farmersdata;
