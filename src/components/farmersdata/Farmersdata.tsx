"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import Button from "../ui/button/Button";

import { toast } from 'react-toastify';
import React from 'react';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import Loader from '@/common/Loader';
import { FarmdersType } from './farmers';
import { Village } from '../Village/village';
import { Taluka } from '../Taluka/Taluka';
import { Schemesdatas } from '../schemesdata/schemes';

const Farmersdata = () => {
  const [data, setData] = useState<FarmdersType[]>([]);
  const [datavillage, setDatavillage] = useState<Village[]>([]);
  const [datataluka, setDatataluka] = useState<Taluka[]>([]);
  const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const { isActive, setIsActive } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/farmers');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  const fetchDatavillages = async () => {
    try {
      const response = await fetch('/api/villages');
      const result = await response.json();
      setDatavillage(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const fetchDatataluka = async () => {
    try {
      const response = await fetch('/api/taluka');
      const result = await response.json();
      setDatataluka(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const fetchDatausercategorycrud = async () => {
    try {
      const response = await fetch('/api/schemescrud');
      const result = await response.json();
      setDataschems(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDatausercategorycrud();
    fetchDatataluka();
    fetchDatavillages();
    fetchData();
  }, []);


  const handleSave = async () => {

    setLoading(true)
    const apiUrl = editId ? `/api/usercategorycrud` : '/api/usercategorycrud';
    const method = editId ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_category_id: editId,
          category_name: inputValue
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }


      toast.success(editId
        ? 'Category updated successfully!'
        : 'Category created successfully!');

      setInputValue('');
      setEditId(null);

      fetchData();

    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(editId
        ? 'Failed to update category. Please try again.'
        : 'Failed to create category. Please try again.');
    } finally {
      setLoading(false); // End loading
    }
  };




  const handleEdit = (item: FarmdersType) => {
    console.log("item",item)
    setIsActive(!isActive)
    // setInputValue(item.category_name);
    // setEditId(item.user_category_id);
  };

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

    {
      key: 'actions',
      label: 'Actions',
      render: (data) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(data)}>
            Edit
          </Button>

          <span>

            <DefaultModal id={data.farmer_id} fetchData={fetchData} endpoint={"usercategorycrud"} />
          </span>

        </div>
      )
    }
  ];

  return (
    <div className="p-4">
      {loading && <Loader />}
      <ReusableTable
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

          <button type='button' onClick={handleSave} className='bg-blue-700 text-white py-2 p-2 rounded'>
            {editId ? 'Update Category' : 'Save Changes'}
          </button>
        }
        searchKey="name"
        rowsPerPage={5}
      />
    </div>
  );
};

export default Farmersdata;
