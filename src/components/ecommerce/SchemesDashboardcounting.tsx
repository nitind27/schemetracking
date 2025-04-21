"use client"
import React, { useEffect, useState } from 'react'

import { UserCategory } from '../usercategory/userCategory';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';

const SchemesDashboardcounting = () => {
    const [data, setData] = useState<UserCategory[]>([]);
    console.log("fasdf",data)
    const [dataschems, setDataschems] = useState<Schemesdatas[]>([]);
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);

    const farmdatasdone = datafarmers.filter((data) => data.schemes == dataschems.map((data) => data.scheme_id).toString()).map((data) => data)

    const farmdatapending = datafarmers.filter((data) => data.schemes != dataschems.map((data) => data.scheme_id).toString()).map((data) => data)


    const alldata = datafarmers.filter((datas) => datas.schemes != "").map((data) => data)
    const schemeIds = alldata.flatMap((data: { schemes: string; }) => data.schemes || []);
    console.log("Extracted scheme IDs:", schemeIds);

    const matches = dataschems.filter(datas =>
        schemeIds.includes(datas.scheme_id.toString()) // Convert to string match
    ); console.log("Matched schemes:", matches);

    const fetchData = async () => {

        try {
            const response = await fetch('/api/usercategorycrud');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    const fetchDataschems = async () => {

        try {
            const response = await fetch('/api/schemescrud');
            const result = await response.json();
            setDataschems(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    const fetchDatafarmers = async () => {

        try {
            const response = await fetch('/api/farmers');
            const result = await response.json();
            setDatafarmers(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchDatafarmers();
        fetchDataschems();
    }, []);


    const columns: Column<Schemesdatas>[] = [
        {
            key: 'scheme_name',
            label: 'Category Name',
            accessor: 'scheme_name',
            render: (matches) => <span>{matches.scheme_name}</span>
        },
        {
            key: 'Benefited',
            label: 'Benefited',
            render: () => (
                <div className="flex">
                    {farmdatasdone.length}

                </div>
            )
        },
        {
            key: 'NotBenefited',
            label: 'Not Benefited',
            render: () => (
                <div className="flex">

                    <span>
                        {farmdatapending.length}
                    </span>


                </div>
            )
        }
    ];
    return (
        <div>
            <Simpletableshowdata
                data={dataschems}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
                        <div className="col-span-1">

                        </div>
                    </div>
                }

                columns={columns}
                title="User Category"
                filterOptions={[]}
                // filterKey="role"
                submitbutton={
                    []
                }
                searchKey="scheme_name"
                rowsPerPage={5}
            />
        </div>
    )
}

export default SchemesDashboardcounting
