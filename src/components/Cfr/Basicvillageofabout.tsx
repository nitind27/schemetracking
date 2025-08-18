"use client";

import { useState } from 'react';

import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";

import React from 'react';
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';

// import { Scheme_year } from '../Yearmaster/yearmaster';
// import { Futureworktype } from './Cfrtype/futurework';


interface Props {
    serverData: basicdetailsofvillagetype[];
}

const Basicvillageofabout: React.FC<Props> = ({ serverData }) => {
    const [data] = useState<basicdetailsofvillagetype[]>(serverData || []);

    const columns: Column<basicdetailsofvillagetype>[] = [
        {
            key: 'year',
            label: 'Taluka',
            accessor: 'taluka_id',
            render: (data) => <span>{data.taluka_id}</span>
        },
        {
            key: 'year',
            label: 'Grampanchayat',
            accessor: 'gp_id',
            render: (data) => <span>{data.gp_id}</span>
        },
        {
            key: 'year',
            label: 'Village',
            accessor: 'village_id',
            render: (data) => <span>{data.village_id}</span>
        },
        {
            key: 'year',
            label: 'Total CFR Area',
            accessor: 'total_cfr_area',
            render: (data) => <span>{data.total_cfr_area}</span>
        },
        {
            key: 'year',
            label: 'Room Number',
            accessor: 'room_number',
            render: (data) => <span>{data.room_number}</span>
        },
        {
            key: 'year',
            label: 'Certificate No',
            accessor: 'certificate_no',
            render: (data) => <span>{data.certificate_no}</span>
        },
        {
            key: 'year',
            label: 'Date',
            accessor: 'date',
            render: (data) => <span>{data.date}</span>
        },
        {
            key: 'year',
            label: 'CFRMC Details',
            accessor: 'cfrmc_details',
            render: (data) => <span>{data.cfrmc_details}</span>
        },
        {
            key: 'year',
            label: 'Bank Details',
            accessor: 'bank_details',
            render: (data) => <span>{data.bank_details}</span>
        },
        {
            key: 'year',
            label: 'CFR Boundary Map',
            accessor: 'cfr_boundary_map',
            render: (data) => <span>{data.cfr_boundary_map}</span>
        },
        {
            key: 'year',
            label: 'CFR Work Info',
            accessor: 'cfr_work_info',
            render: (data) => <span>{data.cfr_work_info}</span>
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

export default Basicvillageofabout;
