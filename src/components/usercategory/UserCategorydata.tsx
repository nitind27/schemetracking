"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { useToggleContext } from '@/context/ToggleContext';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import Button from "../ui/button/Button";
import { UserCategory } from './userCategory';
import DefaultModal from '../example/ModalExample/DefaultModal';
import Loader from '@/common/Loader';

interface Props {
  serverData: UserCategory[];
}

const UserCategorydata: React.FC<Props> = ({ serverData }) => {
  const [data, setData] = useState<UserCategory[]>(serverData || []);
  const [inputValue, setInputValue] = useState('');
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen } = useToggleContext();
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usercategorycrud');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) {
      setInputValue("");
      setEditId(0);
    }
  }, [isEditMode]);

  const handleSave = async () => {
    setLoading(true);
    const apiUrl = '/api/usercategorycrud';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_category_id: editId,
          category_name: inputValue
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success(editId ? 'Category updated successfully!' : 'Category created successfully!');
      setInputValue('');
      setEditId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(editId ? 'Failed to update category.' : 'Failed to create category.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };

  const handleEdit = (item: UserCategory) => {
    setIsmodelopen(true);
    setIsEditmode(true);
    setIsActive(!isActive);
    setInputValue(item.category_name);
    setEditId(item.user_category_id);
  };

  const columns: Column<UserCategory>[] = [
    {
      key: 'category_name',
      label: 'Categories',
      accessor: 'category_name',
      render: (data) => <span>{data.category_name}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (data) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(data)}>Edit</Button>
          <span>
            <DefaultModal id={data.user_category_id} fetchData={fetchData} endpoint={"usercategorycrud"} bodyname='user_category_id'/>
          </span>
        </div>
      ),
    },
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
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>
        }
        columns={columns}
        title="User Category"
        filterOptions={[]}
        submitbutton={
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-700 text-white py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Submitting...' : isEditMode ? 'Update' : 'Save Changes'}
          </button>
        }
        searchKey="category_name"
        rowsPerPage={5}
      />
    </div>
  );
};

export default UserCategorydata;
