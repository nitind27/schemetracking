"use client";

import { useState } from 'react';

import { Column } from "../tables/tabletype";

import React from 'react';

// import { Scheme_year } from '../Yearmaster/yearmaster';
import { Futureworktype } from './Cfrtype/futurework';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Tabviewtable } from '../tables/Tabviewtable';


interface Props {
    serverData: Futureworktype[];
}

const Futurecommer: React.FC<Props> = ({ serverData }) => {
    const [data] = useState<Futureworktype[]>(serverData || []);

    const columns: Column<Futureworktype>[] = [
        {
            key: 'year',
            label: 'Work Name',
            accessor: 'work_name',
            render: (data) => <span>{data.work_name}</span>
        },
        {
            key: 'year',
            label: 'Total Area',
            accessor: 'work_name',
            render: (data) => <span>{data.work_name}</span>
        },
        {
            key: 'year',
            label: 'Estimated Amount',
            accessor: 'estimated_amount',
            render: (data) => <span>{data.estimated_amount}</span>
        },
        {
            key: 'year',
            label: 'Department Name',
            accessor: 'department_name',
            render: (data) => <span>{data.department_name}</span>
        },
        {
            key: 'year',
            label: 'Implementing Method',
            accessor: 'implementing_method',
            render: (data) => <span>{data.implementing_method}</span>
        },
        {
            key: 'year',
            label: 'Work Status',
            accessor: 'work_status',
            render: (data) => <span>{data.work_status}</span>
        },
        {
            key: 'year',
            label: 'User ID',
            accessor: 'username',
            render: (data) => <span>{data.username}</span>
        },
        
    ];

    return (
        <div className="">

        <Tabviewtable
            data={data}
            inputfiled={
                []
            }

            columns={columns}
            title="Year"
            filterOptions={[]}
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
    </div>
    );
};

export default Futurecommer;
    