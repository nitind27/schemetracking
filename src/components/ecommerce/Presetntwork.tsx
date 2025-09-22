"use client";
import { useState } from "react";
import { Column } from "../tables/tabletype";
import React from "react";
import { presentworktype } from "./Cfrtype/futurework";
import { Tabviewtable } from "../tables/Tabviewtable";
import KMLMapButton from "../common/KMLMapButton";

interface Props {
	serverData: presentworktype[];
}

const Presetntwork: React.FC<Props> = ({ serverData }) => {
	const [data] = useState<presentworktype[]>(serverData || []);
    function formatDate(dateString: string | undefined | null): string {
        if (!dateString) return 'उपलब्ध नाही';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'उपलब्ध नाही';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

	const columns: Column<presentworktype>[] = [
		{
			key: "work_name",
			label: "Work Name",
			accessor: "work_name",
			render: (data) => <span>{data.work_name}</span>,
		},
		{
			key: "total_area",
			label: "Total Area",
			accessor: "total_area",
			render: (data) => <span>{data.total_area}</span>,
		},
		{
			key: "estimated_amount",
			label: "Estimated Amount",
			accessor: "estimated_amount",
			render: (data) => <span>{data.estimated_amount}</span>,
		},
		{
			key: "department_name",
			label: "Department Name",
			accessor: "department_name",
			render: (data) => <span>{data.department_name}</span>,
		},
		{
			key: "implementing_method",
			label: "Implementing Method",
			accessor: "implementing_method",
			render: (data) => <span>{data.implementing_method}</span>,
		},
		{
			key: "work_status",
			label: "Work Status",
			accessor: "work_status",
			render: (data) => <span>{data.work_status}</span>,
		},
		{
			key: "work_photo",
			label: "Work Photo",
			accessor: "work_photo",
			render: (data) => (
				<span>
					<img
						src={`${process.env.NEXT_PUBLIC_API_URL}/${data.work_photo}`}
						alt={data.work_photo}
					/>
				</span>
			),
		},
		{
			key: "start_date",
			label: "Work Start Date",
			accessor: "start_date",
			render: (data) => <span>{formatDate(data.start_date)}</span>,
		},
		{
			key: "end_date",
			label: "Work End Date",
			accessor: "end_date",
			render: (data) => <span>{formatDate(data.end_date)}</span>,
		},
		{
			key: "worker_number",
			label: "Work Number",
			accessor: "worker_number",
			render: (data) => <span>{data.worker_number}</span>,
		},
		{
			key: "username",
			label: "User ID",
			accessor: "username",
			render: (data) => <span>{data.username}</span>,
		},
		// {
		// 	key: "gis_location",
		// 	label: "GIS Location",
		// 	accessor: "gis_location",
		// 	render: () => (
		// 		<div className="flex justify-center">
		// 			<KMLMapButton
		// 				kmlFile={"/public/kml/Harankhuri CFR.kml"}
		// 				title="Click to open KML file in Google Earth"
		// 			/>
		// 		</div>
		// 	),
		// },
	];

	const filterOptions = [
		{
			label: "type",
			options: [
				{ label: "All", value: "" },
				{ label: "Plantation", value: "Plantation" },
				{ label: "NRM", value: "NRM" },
			],
		},
		{
			label: "work_status",
			options: [
				{ label: "All", value: "" },
				{ label: "Pending", value: "Pending" },
				{ label: "In Progress", value: "In Progress" },
				{ label: "Complete", value: "Completed" },
			],
		},
	];


	return (
		<div className="">
			<Tabviewtable
				data={data}
				inputfiled={[]}
				columns={columns}
				title="Year"
				filterOptions={filterOptions}
				searchKey="work_name"
				tabFilter={{
					field: "type",
					fallbackFields: [],
					normalize: true,
					tabs: [
						{ label: "All", value: "" },
						{ label: "Plantation", value: "Plantation" },
						{ label: "NRM", value: "NRM" },
					],
				}}
			/>

		</div>
	);
};

export default Presetntwork;
