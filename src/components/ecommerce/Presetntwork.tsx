"use client";
import { useState } from "react";
import { Column } from "../tables/tabletype";
import React from "react";
import { presentworktype } from "./Cfrtype/futurework";
import { Searchtable } from "../tables/Searchtable";

interface Props {
	serverData: presentworktype[];
	// serverData1: presentworktype[];
}

const Presetntwork: React.FC<Props> = ({ serverData }) => {
	const [data] = useState<presentworktype[]>(serverData || []);
	// const [chartData] = useState<presentworktype[]>(serverData1 || []);
	// Create data1 with proper village count by taluka
	// const data1 = React.useMemo(() => {
	// 	const talukaVillageMap = new Map<string, Set<string>>();
		
	// 	// Count unique villages per taluka
	// 	data.forEach(item => {
	// 		const taluka = item.taluka_name || "Unknown";
	// 		const village = item.village_name || "Unknown";
			
	// 		if (!talukaVillageMap.has(taluka)) {
	// 			talukaVillageMap.set(taluka, new Set());
	// 		}
	// 		talukaVillageMap.get(taluka)!.add(village);
	// 	});
		
	// 	// Convert to array format for chart
	// 	const result: Array<{taluka: string, villageCount: number, villages: string[]}> = [];
	// 	talukaVillageMap.forEach((villages, taluka) => {
	// 		result.push({
	// 			taluka,
	// 			villageCount: villages.size,
	// 			villages: Array.from(villages)
	// 		});
	// 	});
		
	// 	return result;
	// }, [data]);
	
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
			key: "taluka_name",
			label: "Taluka",
			accessor: "taluka_name",
			render: (data) => <span>{data.taluka_name}</span>,
			searchable: true, // Enable search for this column
		},
		{
			key: "gp_name",
			label: "Grampanchayat",
			accessor: "gp_name",
			render: (data) => <span>{data.gp_name || 'N/A'}</span>,
			searchable: true, // Enable search for this column
		},
		{
			key: "village_name",
			label: "Village",
			accessor: "village_name",
			render: (data) => <span>{data.village_name || 'N/A'}</span>,
			searchable: true, // Enable search for this column
		},
		{
			key: "work_name",
			label: "Work Name",
			accessor: "work_name",
			render: (data) => <span>{data.work_name}</span>,
			searchable: true, // Enable search for this column
		},
	
		{
			key: "total_area",
			label: "Total Area",
			accessor: "total_area",
			render: (data) => <span>{data.total_area}</span>,
			searchable: false, // Disable search for this column
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
			key: "type",
			label: "Type",
			accessor: "type",
			render: (data) => <span>{data.type}</span>,
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
		<div className="space-y-6">
			

			{/* Data Table */}
			<div className="">
				<Searchtable
					data={data}
					inputfiled={[]}
					columns={columns}
					title="Year"
					filterOptions={filterOptions}
					searchKey="work_name"
					enableColumnSearch={true} // Enable column-wise search
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
		</div>
	);
};

export default Presetntwork;
