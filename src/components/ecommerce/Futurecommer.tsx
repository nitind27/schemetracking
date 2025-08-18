"use client";

import { useState } from 'react';

import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

import React from 'react';

// import { Scheme_year } from '../Yearmaster/yearmaster';
import { Futureworktype } from './Cfrtype/futurework';


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
            accessor: 'user_id',
            render: (data) => <span>{data.user_id}</span>
        },
        {
            key: 'year',
            label: 'Status',
            accessor: 'status',
            render: (data) => <span>{data.status}</span>
        },
    ];

    return (
        <div className="">

            <ReusableTable
                data={data}
                inputfiled={
                    []
                }

                columns={columns}
                title="Year"
                filterOptions={[]}
                // filterKey="role"

                searchKey="year"

            />
        </div>
    );
};

export default Futurecommer;
