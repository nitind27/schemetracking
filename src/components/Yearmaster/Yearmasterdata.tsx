"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import Button from "../ui/button/Button";
import { Scheme_year } from './yearmaster';
import { toast } from 'react-toastify';
import React from 'react';
import { useToggleContext } from '@/context/ToggleContext';

const Yearmasterdata = () => {
    const [data, setData] = useState<Scheme_year[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive } = useToggleContext();
     const [loading, setLoading] = useState(false);
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/yearmaster');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }finally {
            setLoading(false); // End loading
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    const handleSave = async () => {
        setLoading(true);
        if (!inputValue.trim()) {
            toast.error("Category name cannot be empty!");
            return;
        }

        const apiUrl = editId ? `/api/yearmaster` : '/api/yearmaster';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({

                    year: inputValue
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
        }finally {
            setLoading(false); // End loading
        }
    };


    const handleDelete = async (id: number) => {
        setLoading(true);
        try {
            const response = await fetch('/api/yearmaster', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }finally {
            setLoading(false); // End loading
        }
    };

    const handleEdit = (item: Scheme_year) => {
        setIsActive(!isActive)
        setInputValue(item.year);
        setEditId(item.scheme_year_id);
    };

    const columns: Column<Scheme_year>[] = [
        {
            key: 'year',
            label: 'Year',
            accessor: 'year',
            render: (data) => <span>{data.year}</span>
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (data) => (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(data)}>
                        Edit
                    </Button>
                    <Button
                        size="sm"

                        onClick={() => handleDelete(data.scheme_year_id)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4">

            <ReusableTable
                data={data}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1">
                            <Label>Year</Label>
                            <input
                                type="text"
                                placeholder="Enter Year"
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>
                    </div>
                }

                columns={columns}
                title="Year"
                filterOptions={[]}
                // filterKey="role"
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 p-2 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (editId ? 'Update Year' : 'Save Changes')}
                    </button>
                }
                searchKey="year"
                rowsPerPage={5}
            />
        </div>
    );
};

export default Yearmasterdata;
