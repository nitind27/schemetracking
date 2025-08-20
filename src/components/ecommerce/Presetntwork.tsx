"use client";
import { useState } from 'react';
import { Column } from "../tables/tabletype";
import React from 'react';
// import { Scheme_year } from '../Yearmaster/yearmaster';
import { presentworktype } from './Cfrtype/futurework';
// import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { Tabviewtable } from '../tables/Tabviewtable';
import KMLMapButton from '../common/KMLMapButton';

interface Props {
	serverData: presentworktype[];
}

const Presetntwork: React.FC<Props> = ({ serverData }) => {
	const [data] = useState<presentworktype[]>(serverData || []);
	
	const columns: Column<presentworktype>[] = [
		{
			key: 'work_name',
			label: 'Work Name',
			accessor: 'work_name',
			render: (data) => <span>{data.work_name}</span>
		},
		{
			key: 'total_area',
			label: 'Total Area',
			accessor: 'total_area',
			render: (data) => <span>{data.total_area}</span>
		},
		{
			key: 'estimated_amount',
			label: 'Estimated Amount',
			accessor: 'estimated_amount',
			render: (data) => <span>{data.estimated_amount}</span>
		},
		{
			key: 'department_name',
			label: 'Department Name',
			accessor: 'department_name',
			render: (data) => <span>{data.department_name}</span>
		},
		{
			key: 'implementing_method',
			label: 'Implementing Method',
			accessor: 'implementing_method',
			render: (data) => <span>{data.implementing_method}</span>
		},
		{
			key: 'work_status',
			label: 'Work Status',
			accessor: 'work_status',
			render: (data) => <span>{data.work_status}</span>
		},
		
		{
			key: 'work_photo',
			label: 'Work Photo',
			accessor: 'work_photo',
			render: (data) => <span><img
				src={`${process.env.NEXT_PUBLIC_API_URL}/${data.work_photo}`}
				alt={data.work_photo}
			/>
			</span>
		},
		{
			key: 'start_date',
			label: 'Work Start Date',
			accessor: 'start_date',
			render: (data) => <span>{data.start_date}</span>
		},
		{
			key: 'end_date',
			label: 'Work End Date',
			accessor: 'end_date',
			render: (data) => <span>{data.end_date}</span>
		},
		{
			key: 'worker_number',
			label: 'Work Number',
			accessor: 'worker_number',
			render: (data) => <span>{data.worker_number}</span>
		},
		{
			key: 'username',
			label: 'User ID',
			accessor: 'username',
			render: (data) => <span>{data.username}</span>
		},
		{
			key: 'gis_location',
			label: 'GIS Location',
			accessor: 'gis_location',
			render: () => (
				<div className="flex justify-center">
					<KMLMapButton 
						kmlFile={"/public/kml/Harankhuri CFR.kml"} 
						title="Click to open KML file in Google Earth"
					/>
				</div>
			)
		},
	];
	
	return (
		<div className="">
			<Tabviewtable
				data={data}
				inputfiled={[]}
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

export default Presetntwork;