"use client";

import {  useState } from 'react';

import Label from "../form/Label";

import { Column } from "../tables/tabletype";
// import Button from "../ui/button/Button";

import React from 'react';

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

  // const [datavillage, setDatavillage] = useState<Village[]>([]);
  // const [datataluka, setDatataluka] = useState<Taluka[]>([]);
  // const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
  const [inputValue, setInputValue] = useState('');
  

  const columns: Column<FarmdersType>[] = [
    {
      key: 'category_name',
      label: 'Name',
      accessor: 'name',
      render: (data) => <span>{data.name}</span>
    },


    {
      key: 'adivasi',
      label: 'Adivasi',
      accessor: 'adivasi',
      render: (data) => <span>{data.adivasi}</span>
    },
    {
      key: 'village_id',
      label: 'Village',
      accessor: 'village_id',
      render: (data) => <span>{datavillage.filter((datas) => datas.village_id == Number(data.village_id)).map((data) => data.name)}</span>
    },
    {
      key: 'taluka_id',
      label: 'Taluka',
      accessor: 'taluka_id',
      render: (data) => <span>{datataluka.filter((datas) => datas.taluka_id == Number(data.taluka_id)).map((data) => data.name)}</span>
    },
    {
      key: 'gat_no',
      label: 'Gat No',
      accessor: 'gat_no',
      render: (data) => <span>{data.gat_no}</span>
    },
    {
      key: 'vanksetra',
      label: 'Vanksetra',
      accessor: 'vanksetra',
      render: (data) => <span>{data.vanksetra}</span>
    },
    {
      key: 'nivas_seti',
      label: 'Nivas Seti',
      accessor: 'nivas_seti',
      render: (data) => <span>{data.nivas_seti}</span>
    },
    {
      key: 'aadhaar_no',
      label: 'Aadhaar No',
      accessor: 'aadhaar_no',
      render: (data) => <span>{data.aadhaar_no}</span>
    },
    {
      key: 'contact_no',
      label: 'Contact No',
      accessor: 'contact_no',
      render: (data) => <span>{data.contact_no}</span>
    },
    {
      key: 'email',
      label: 'Email',
      accessor: 'email',
      render: (data) => <span>{data.email}</span>
    },
    {
      key: 'kisan_id',
      label: 'Kisan Id',
      accessor: 'kisan_id',
      render: (data) => <span>{data.kisan_id}</span>
    },
    {
      key: 'documents',
      label: 'Documents',
      accessor: 'documents',
      render: (data) => <span>{data.documents}</span>
    },
    {
      key: 'schemes',
      label: 'Schemes',
      accessor: 'schemes',
      render: (data) => <span>{dataschems.filter((datas) => datas.scheme_id == Number(data.schemes)).map((data) => data.scheme_name)}</span>
    },

  ];

  return (
    <div className="">
   
      <Simpletableshowdata
        data={data}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div className="col-span-1">
              <Label>User Category</Label>
              <input
                type="text"
                placeholder="Enter category name"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>
        }

        columns={columns}
        title="User Category"
        filterOptions={[]}
        // filterKey="role"
        submitbutton={

          <button type='button' className='bg-blue-700 text-white py-2 p-2 rounded'>
            {'Save Changes'}
          </button>
        }
        searchKey="name"
        
      />
    </div>
  );
};

export default Farmersdata;
