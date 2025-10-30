"use client";

import { useEffect, useState } from 'react';

import { Column } from "../tables/tabletype";

import React from 'react';

// import { Scheme_year } from '../Yearmaster/yearmaster';
import { Futureworktype } from './Cfrtype/futurework';
// import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Tabviewtable } from '../tables/Tabviewtable';
// Inline Modal (same style as Presetntwork)
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex z-99999 items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-3 p-6 relative">
                <button className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-red-500 font-bold" onClick={onClose}>&times;</button>
                <h3 className="mb-4 text-lg font-bold text-center">{title}</h3>
                <div className="overflow-auto max-h-[70vh]">{children}</div>
            </div>
        </div>
    );
}


interface Props {
    serverData: Futureworktype[];
}

type SelectOption = { label: string; value: string };

const Futurecommer: React.FC<Props> = ({ serverData }) => {
    const [data] = useState<Futureworktype[]>(serverData || []);
    const [selectedWork, setSelectedWork] = useState<Futureworktype | null>(null);

    type ModalField = {
        key: keyof Futureworktype;
        label: string;
        render?: (row: Futureworktype) => React.ReactNode;
    };

    const modalFields: ModalField[] = [
        { key: 'taluka_name', label: 'Taluka' },
        { key: 'gp_name', label: 'Grampanchayat' },
        { key: 'village_name', label: 'Village' },
        { key: 'total_area', label: 'Total Area' },
        { key: 'estimated_amount', label: 'Estimated Amount' },
        { key: 'department_name', label: 'Department Name' },
        { key: 'implementing_method', label: 'Implementing Method' },
        { key: 'work_status', label: 'Work Status' },
        { key: 'username', label: 'User ID' },
        { key: 'user_id', label: 'Internal User ID' },
        { key: 'status', label: 'Status' },
      
    ];

    const renderWorkModal = () => (
        !selectedWork ? null : (
            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {modalFields.map(({ key, label, render }) => {
                        const value = render ? render(selectedWork) : selectedWork[key];
                        if (value === undefined || value === null || value === "") return null;
                        return (
                            <div key={String(key)}>
                                <span className="font-semibold">{label}:</span> <span>{String(value)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    );

    // Dropdown options
    const [talukaOptions, setTalukaOptions] = useState<SelectOption[]>([]);
    const [villageOptions, setVillageOptions] = useState<SelectOption[]>([]);
    const [gpOptions, setGpOptions] = useState<SelectOption[]>([]);

    useEffect(() => {
        const base = process.env.NEXT_PUBLIC_API_URL || "";

        const fetchAll = async () => {
            try {
                const [tRes, vRes, gRes] = await Promise.all([
                    fetch(`${base}/api/taluka`, { cache: 'no-store' }),
                    fetch(`${base}/api/villages`, { cache: 'no-store' }),
                    fetch(`${base}/api/grampanchyat`, { cache: 'no-store' }),
                ]);

                const [talukas, villages, gps] = await Promise.all([
                    tRes.json(),
                    vRes.json(),
                    gRes.json(),
                ]);

                setTalukaOptions(
                    (Array.isArray(talukas) ? talukas : []).map((t) => ({
                        label: t.name ?? String(t.taluka_name ?? ""),
                        value: t.name ?? String(t.taluka_name ?? ""),
                    }))
                );

                setVillageOptions(
                    (Array.isArray(villages) ? villages : []).map((v) => {
                        const name = v.marathi_name ?? v.name ?? "";
                        return { label: String(name), value: String(name) };
                    })
                );

                setGpOptions(
                    (Array.isArray(gps) ? gps : []).map((g) => ({
                        label: g.gpname ?? String(g.gp_name ?? ""),
                        value: g.gpname ?? String(g.gp_name ?? ""),
                    }))
                );
            } catch (e) {
                console.error(e);
            }
        };

        fetchAll();
    }, []);

    const columns: Column<Futureworktype>[] = [
        {
            key: 'taluka_name',
            label: 'Taluka',
            accessor: 'taluka_name',
            render: (row) => <span>{row.taluka_name || 'N/A'}</span>
        },
        
        {
            key: 'gp_name',
            label: 'Grampanchayat',
            accessor: 'gp_name',
            render: (row) => <span>{row.gp_name || 'N/A'}</span>
        },
        {
            key: 'village_name',
            label: 'Village',
            accessor: 'village_name',
            render: (row) => <span>{row.village_name || 'N/A'}</span>
        },
        {
            key: 'work_name',
            label: 'Work Name',
            accessor: 'work_name',
            render: (row) => (
                <span
                    className="cursor-pointer underline text-blue-700"
                    onClick={() => setSelectedWork(row)}
                >
                    {row.work_name}
                </span>
            )
        },
        
    ];

    const filterOptions = [
        {
            label: 'Taluka',
            options: talukaOptions,
        },
        {
            label: 'Village',
            options: villageOptions,
        },
        {
            label: 'Grampanchayat',
            options: gpOptions,
        },
    ];

    return (
        <div className="">
            <Tabviewtable
                data={data}
                inputfiled={[]}
                columns={columns}
                title="Future Work"
                filterOptions={filterOptions}
                searchKey="work_name"
                tabFilter={{
                    field: 'work_status',
                    fallbackFields: ['status'],
                    normalize: true,
                    tabs: [
                        { label: 'All', value: '' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'In Progress', value: 'inprogress' },
                        { label: 'Complete', value: 'complete' },
                    ],
                }}
            />
            <Modal open={!!selectedWork} onClose={() => setSelectedWork(null)} title={`Work Name: ${selectedWork?.work_name ?? ''}`}>
                {renderWorkModal()}
            </Modal>
        </div>
    );
};

export default Futurecommer;
    