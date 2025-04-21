"use client";

import { useEffect, useState } from 'react';
import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import Button from "../ui/button/Button";
import Select from 'react-select';
import { toast } from 'react-toastify';
import React from 'react';
import { Schemesdatas } from './schemes';
import { MultiValue } from 'react-select';
import { useToggleContext } from '@/context/ToggleContext';
import Loader from '@/common/Loader';

// Define a more specific type for document options
interface DocOption {
    label: string;
    value: number; // Or string, depending on your data
}

// Define a type for the data fetched from the API
interface schemescategory {
    scheme_category_id: number;
    name: string;
}
interface schemesSubcategory {
    scheme_sub_category_id: number;
    scheme_category_id: number;
    name: string;
}
interface schemesYear {
    scheme_year_id: number;
    year: string;
}


const Schemesdata = () => {
    const [data, setData] = useState<Schemesdatas[]>([]);
    const [filtercategory, setfiltercategory] = useState<schemescategory[]>([]);
    const [filterdocument, setfilterdocument] = useState<
        {
            id: number;
            document_name: string;
        }[]
    >([]);

    const [filtersubcategory, setfiltersubcategory] = useState<schemesSubcategory[]>([]);
    const [filteryear, setfilteryear] = useState<schemesYear[]>([]);
    // Remove or use inputValue to fix the no-unused-vars error
    // const [inputValue, setInputValue] = useState('');
    const { isActive, setIsActive } = useToggleContext();

    const [schemecategoryid, setschemecategoryid] = useState(0);
    const [schemesubcategoryid, setschemesubcategoryid] = useState(0);
    const [schemeyearid, setschemeyearid] = useState(0);
    const [schemename, setschemename] = useState('');
    const [beneficieryname, setbeneficieryname] = useState('');
    const [applyedat, setapplyedat] = useState('');
    const [link, setlink] = useState('');
    const [documents, setdocuments] = useState<DocOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Use the DocOption type here
    const docoptions: DocOption[] = filterdocument.map(doc => ({
        label: doc.document_name,
        value: doc.id
    }));

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/schemescrud');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };

    const fetchDataCategory = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/schemescategory');
            const result = await response.json();
            setfiltercategory(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };

    const fetchDataDocument = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/documents');
            const result = await response.json();
            setfilterdocument(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };

    const fetchDataSubCategory = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/schemessubcategory');
            const result = await response.json();
            setfiltersubcategory(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // End loading
        }
    };

    const fetchDatayear = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/yearmaster');
            const result = await response.json();
            setfilteryear(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        finally {
            setLoading(false); // End loading
        }
    };

    useEffect(() => {
        fetchData();
        fetchDataDocument();
        fetchDataCategory();
        fetchDataSubCategory();
        fetchDatayear();
    }, []);

    const handleSave = async () => {
        setLoading(true)
        const apiUrl = editId ? `/api/schemescrud` : '/api/schemescrud';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheme_category_id: schemecategoryid,
                    scheme_sub_category_id: schemesubcategoryid,
                    scheme_year_id: schemeyearid,
                    scheme_name: schemename,
                    beneficiery_name: beneficieryname,
                    applyed_at: applyedat,
                    link: link,
                    documents: documents.map((data: DocOption) => data.value).join(',')
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success(editId
                ? 'Schemes updated successfully!'
                : 'Schemes created successfully!');

            // setInputValue(''); // Remove or use inputValue
            setEditId(null);
            fetchData();

        } catch (error) {
            console.error('Error saving Schemes:', error);
            toast.error(editId
                ? 'Failed to update Schemes. Please try again.'
                : 'Failed to create Schemes. Please try again.');
        }
        finally {
            setLoading(false); // End loading
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch('/api/usercategorycrud', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_category_id: id })
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleEdit = (item: Schemesdatas) => {
        setIsActive(!isActive)
        setschemecategoryid(item.scheme_category_id)
        setschemesubcategoryid(item.scheme_sub_category_id)
        setschemeyearid(item.scheme_year_id)
        setschemename(item.scheme_name)
        setbeneficieryname(item.beneficiery_name)
        setapplyedat(item.applyed_at)
        setlink(item.link)
        try {
            const parsedDocs = JSON.parse(item.documents);
            setdocuments(Array.isArray(parsedDocs) ? parsedDocs : []);
        } catch (error) {
            console.error("Failed to parse documents:", error);
            setdocuments([]);
        }

    };
    // Document ID से नाम मैपिंग
    const documentMap = new Map(filterdocument.map(doc => [doc.id, doc.document_name]));

    const columns: Column<Schemesdatas>[] = [
        {
            key: 'scheme_category_id',
            label: 'Category',
            accessor: 'scheme_category_id',
            render: (data) => <span>{filtercategory.filter((datacat) => datacat.scheme_category_id == data.scheme_category_id).map((datamap) => datamap.name)}</span>
        },
        {
            key: 'scheme_sub_category_id',
            label: 'SubCategory',
            accessor: 'scheme_sub_category_id',

            render: (data) => <span>{filtersubcategory.filter((datacat) => datacat.scheme_sub_category_id == data.scheme_sub_category_id).map((datamap) => datamap.name)}</span>
        },
        {
            key: 'scheme_year_id',
            label: 'Year',
            accessor: 'scheme_year_id',
            render: (data) => <span>{filteryear.filter((datayear) => datayear.scheme_year_id == data.scheme_year_id).map((datamap) => datamap.year)}</span>
        },
        {
            key: 'scheme_name',
            label: 'Name',
            accessor: 'scheme_name',
            render: (data) => <span>{data.scheme_name}</span>
        },
        {
            key: 'beneficiery_name',
            label: 'Beneficiery',
            accessor: 'beneficiery_name',
            render: (data) => <span>{data.beneficiery_name}</span>
        },
        {
            key: 'applyed_at',
            label: 'Applyed',
            accessor: 'applyed_at',
            render: (data) => <span>{data.applyed_at}</span>
        },
        {
            key: 'link',
            label: 'Link (url)',
            accessor: 'link',
            render: (data) => <span>{data.link}</span>
        },
        {
            key: 'documents',
            label: 'Documents',
            accessor: 'documents',
            render: (data) => {
                if (!data.documents) return <span>-</span>;

                let docIds = [];
                try {
                    // Parse the string, replacing single quotes with double quotes for valid JSON
                    const parsed = JSON.parse(data.documents.replace(/'/g, '"'));
                    // If parsed value is an array, use as is; if not, wrap in array
                    docIds = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    // Fallback: split by comma, parse as integers, filter out NaN
                    docIds = data.documents
                        .split(',')
                        .map(part => parseInt(part.trim()))
                        .filter(num => !isNaN(num));
                }

                // Ensure docIds is always an array (extra safety)
                if (!Array.isArray(docIds)) {
                    docIds = [docIds];
                }

                const docNames = docIds
                    .map(id => documentMap.get(id))
                    .filter(Boolean);

                return docNames.length > 0
                    ? <span>{docNames.join(', ')}</span>
                    : <span>-</span>;
            }
        }

        ,
        {
            key: 'status',
            label: 'Status',
            accessor: 'status',
            render: (data) => <span>{data.status}</span>
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
                        onClick={() => handleDelete(data.scheme_id)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    // Use the DocOption type here
    const handleChange = (
        selected: MultiValue<DocOption>,
        // _actionMeta: ActionMeta<DocOption>
    ) => {
        console.log("fasdf")
        // Convert readonly array to regular array
        setdocuments(selected ? [...selected] : []);
    };

    return (
        <div className="p-4">
            {loading && <Loader />}
            <ReusableTable
                data={data}
                title='Schemes'
                classname={"h-[550px] overflow-y-auto scrollbar-hide"}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div>
                            <Label>Category</Label>
                            <select
                                name=""
                                id=""
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={schemecategoryid}
                                onChange={(e) => setschemecategoryid(Number(e.target.value))}
                            >
                                <option value="">Category</option>
                                {filtercategory.map((category) => (
                                    <option key={category.scheme_category_id} value={category.scheme_category_id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Sub Category</Label>
                            <select
                                name=""
                                id=""
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={schemesubcategoryid}
                                onChange={(e) => setschemesubcategoryid(Number(e.target.value))}
                            >
                                <option value="">Sub Category</option>
                                {filtersubcategory
                                    .filter((data) => data.scheme_category_id == Number(schemecategoryid))
                                    .map((category) => (
                                        <option key={category.scheme_sub_category_id} value={category.scheme_sub_category_id}>
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <Label>Scheme Year</Label>
                            <select
                                name=""
                                id=""
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={schemeyearid}
                                onChange={(e) => setschemeyearid(Number(e.target.value))}
                            >
                                <option value="">Year</option>
                                {filteryear.map((category) => (
                                    <option key={category.scheme_year_id} value={category.scheme_year_id}>
                                        {category.year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1">
                            <Label>Name</Label>
                            <input
                                type="text"
                                placeholder="Enter name"
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={schemename}
                                onChange={(e) => setschemename(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label>Beneficiery</Label>
                            <input
                                type="text"
                                placeholder="Enter Beneficiery"
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={beneficieryname}
                                onChange={(e) => setbeneficieryname(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label>Applyed</Label>
                            <input
                                type="text"
                                placeholder="Applyed"
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={applyedat}
                                onChange={(e) => setapplyedat(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label>Link</Label>
                            <input
                                type="text"
                                placeholder="Link"
                                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                value={link}
                                onChange={(e) => setlink(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label>Documents</Label>
                            <Select
                                isMulti
                                options={docoptions}

                                onChange={handleChange}
                                value={documents} // Control the selected values
                            />
                        </div>

                    </div>
                }
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 p-2 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (editId ? 'Update Schemes' : 'Save Changes')}
                    </button>
                }

                columns={columns}
            />
        </div>
    );
};

export default Schemesdata;
