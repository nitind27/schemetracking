"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";


import { toast } from 'react-toastify';
import React from 'react';
import { useToggleContext } from '@/context/ToggleContext';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';

import { Documents } from '../Documentsdata/documents';
import { Supporteddatatype } from './Supporteddatatype';


interface Props {
    serverData: Supporteddatatype[];
    documents: Documents[];
}
type FormErrors = {

    years?: string;
};
const Supporteddata: React.FC<Props> = ({ serverData, documents }) => {
    const [data, setData] = useState<Supporteddatatype[]>(serverData || []);
    const [documentdata, setDocumentdata] = useState<Documents[]>(documents || []);
    const [documentsinput, setDocumentsinput] = useState('');
    const [informationinput, setInformationinput] = useState('');
    const [supportedDocument, setSupportedsdocument] = useState('');
    const [linkinput, setLinkinput] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
    const [loading, setLoading] = useState(false);
    const [error, setErrors] = useState<FormErrors>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/supportedapi');
            const response1 = await fetch('/api/documents');
            const result = await response.json();
            const result1 = await response1.json();
            setData(result);
            setDocumentdata(result1);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setIsmodelopen(false);
        }
    };

    useEffect(() => {

        if (!isvalidation) {

            setErrors({})
        }
    }, [isvalidation])


    const validateInputs = () => {
        const newErrors: FormErrors = {};
        setisvalidation(true)
        // Category validation

        // Documents validation
        if (!documentsinput || documentsinput.length === 0) {
            newErrors.years = "Year is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;
        setLoading(true);


        const apiUrl = editId ? `/api/supportedapi` : '/api/supportedapi';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supported_id: editId,
                    document_id: documentsinput,
                    info: informationinput,
                    supported_docs: supportedDocument,
                    link: linkinput

                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }


            toast.success(editId
                ? 'Year updated successfully!'
                : 'Year created successfully!');

            setDocumentsinput('');
            setEditId(null);
            fetchData();

        } catch (error) {
            console.error('Error saving Year:', error);
            toast.error(editId
                ? 'Failed to update Year. Please try again.'
                : 'Failed to create Year. Please try again.');
        } finally {
            setLoading(false); // End loading
        }
    };

    useEffect(() => {
        if (!isEditMode) {
            setDocumentsinput("");
            setEditId(0);
        }
    }, [isEditMode]);

    const handleEdit = (item: Supporteddatatype) => {
        setIsmodelopen(true);
        setIsEditmode(true);
        setIsActive(!isActive)
        setDocumentsinput(item.document_id);
        setInformationinput(item.info);
        setSupportedsdocument(item.supported_docs);
        setLinkinput(item.link);
        setDocumentsinput(item.document_id);
        setEditId(item.supported_id);
    };

    const columns: Column<Supporteddatatype>[] = [
        {
            key: 'document_id',
            label: 'Document',
            accessor: 'document_id',
            render: (data) => <span>{data.document_id}</span>
        },
        {
            key: 'info',
            label: 'Information',
            accessor: 'info',
            render: (data) => <span>{data.info}</span>
        },
        {
            key: 'supported_docs',
            label: 'Supported Documents',
            accessor: 'supported_docs',
            render: (data) => <span>{data.supported_docs}</span>
        },
        {
            key: 'link',
            label: 'Link',
            accessor: 'link',
            render: (data) => <span>{data.link}</span>
        },

        {
            key: 'actions',
            label: 'Actions',
            render: (data) => (
                <div className="flex gap-2 whitespace-nowrap w-full">
                    <span
                        onClick={() => handleEdit(data)}
                        className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <FaEdit className="inline-block align-middle text-lg" />
                    </span>

                    <span>
                        <DefaultModal id={data.supported_id} fetchData={fetchData} endpoint={"supportedapi"} bodyname='supported_id' newstatus={data.status} />
                    </span>
                </div>
            )
        }
    ];

    return (
        <div className="">

            <ReusableTable
                data={data}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1">
                            <Label>Documents</Label>
                            <select
                                name=""
                                id=""
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.years ? "border-red-500" : ""
                                    }`}
                                value={documentsinput}
                                onChange={(e) => setDocumentsinput(e.target.value)}
                            >
                                <option value="">Category</option>
                                {documentdata.map((documents) => (
                                    <option key={documents.id} value={documents.id}>
                                        {documents.document_name}
                                    </option>
                                ))}
                            </select>
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.years}
                                </div>
                            )}
                        </div>
                        <div className="col-span-1">
                            <Label>Information</Label>

                            <textarea
                                rows={4}
                                cols={50}
                                placeholder="Enter Year"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.years ? "border-red-500" : ""
                                    }`}
                                value={informationinput}
                                onChange={(e) => setInformationinput(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.years}
                                </div>
                            )}
                        </div>
                        <div className="col-span-1">
                            <Label>Supported Document</Label>
                            <input
                                type="text"
                                placeholder="Enter Year"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.years ? "border-red-500" : ""
                                    }`}
                                value={supportedDocument}
                                onChange={(e) => setSupportedsdocument(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.years}
                                </div>
                            )}
                        </div>
                        <div className="col-span-1">
                            <Label>Link</Label>
                            <input
                                type="text"
                                placeholder="Enter Year"
                                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.years ? "border-red-500" : ""
                                    }`}
                                value={linkinput}
                                onChange={(e) => setLinkinput(e.target.value)}
                            />
                            {error && (
                                <div className="text-red-500 text-sm mt-1 pl-1">
                                    {error.years}
                                </div>
                            )}
                        </div>
                    </div>
                }

                columns={columns}
                title="Supported"
                filterOptions={[]}
                // filterKey="role"
                submitbutton={
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-blue-700 text-white py-2 p-2 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : (editId ? 'Update' : 'Save Changes')}
                    </button>
                }
                searchKey="year"

            />
        </div>
    );
};

export default Supporteddata;
