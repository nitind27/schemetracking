"use client";
import { useState } from "react";
import { Column } from "../tables/tabletype";
import React from "react";
import { basicdetailsofvillagetype, presentworktype } from "./Cfrtype/futurework";
import { Searchtable } from "../tables/Searchtable";
import WorkTypePieCharts from "./WorkTypePieCharts";
import WorkStatusPieChart from "./WorkStatusPieChart"; // Add this import

// --- Modal Implementation ---
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
	serverData: presentworktype[];
	basicVillageData: basicdetailsofvillagetype[];
}

const Presetntwork: React.FC<Props> = ({ serverData, basicVillageData }) => {
	const [data] = useState<presentworktype[]>(serverData || []);
	const [data1] = useState<basicdetailsofvillagetype[]>(basicVillageData || []);
	const [selectedWork, setSelectedWork] = useState<presentworktype | null>(null); // <-- NEW
	console.log("serverData", data1);
	function formatDate(dateString: string | undefined | null): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'N/A';
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	}
	// Modal content for selected work
	// Helper for modal field config
	type ModalField = {
		key: keyof presentworktype;
		label: string;
		render?: (row: presentworktype) => React.ReactNode;
	};

	const modalFields: ModalField[] = [
		{ key: "taluka_name", label: "Taluka" },
		{ key: "gp_name", label: "Grampanchayat" },
		{ key: "village_name", label: "Village" },
	
		{ key: "total_area", label: "Total Area" },
		{ key: "estimated_amount", label: "Estimated Amount" },
		{ key: "department_name", label: "Department Name" },
		{ key: "implementing_method", label: "Implementing Method" },
		{ key: "type", label: "Type" },
		{ key: "work_status", label: "Work Status" },
		{
			key: "work_photo", label: "Work Photo", render: row => row.work_photo ?
				<img
					src={`${process.env.NEXT_PUBLIC_API_URL || ''}/${row.work_photo}`}
					alt={row.work_name}
					className="h-24 w-auto rounded border mb-2"
					onError={e => (e.currentTarget.style.display = 'none')}
				/> : 'No Image'
		},
		{ key: "start_date", label: "Work Start Date", render: row => formatDate(row.start_date) },
		{ key: "end_date", label: "Work End Date", render: row => formatDate(row.end_date) },
		{ key: "worker_number", label: "Work Number" },
		{ key: "username", label: "User Name" },
	];

	const renderWorkModal = () => (
		!selectedWork ? null : (
			<div className="space-y-3">
				{/* <div className="font-semibold text-blue-800 text-lg mb-3">{selectedWork.work_status}</div> */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
					{modalFields.map(({ key, label, render }) => {
						const value = render ? render(selectedWork) : selectedWork[key];
						if (value === undefined || value === null || value === "") return null;
						return (
							<div key={String(key)}>
								<span className="font-semibold">{label}:</span> <span>{value}</span>
							</div>
						);
					})}
				</div>
			</div>
		)
	);

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
			render: (row) => (
				<span
					className="cursor-pointer underline text-blue-700"
					onClick={() => setSelectedWork(row)}
				>
					{row.work_name}
				</span>
			),
			searchable: true, // Enable search for this column
		},

		// {
		// 	key: "total_area",
		// 	label: "Total Area",
		// 	accessor: "total_area",
		// 	render: (data) => <span>{data.total_area}</span>,
		// 	searchable: false, // Disable search for this column
		// },
		// {
		// 	key: "estimated_amount",
		// 	label: "Estimated Amount",
		// 	accessor: "estimated_amount",
		// 	render: (data) => <span>{data.estimated_amount}</span>,
		// },
		// {
		// 	key: "department_name",
		// 	label: "Department Name",
		// 	accessor: "department_name",
		// 	render: (data) => <span>{data.department_name}</span>,
		// },
		// {
		// 	key: "implementing_method",
		// 	label: "Implementing Method",
		// 	accessor: "implementing_method",
		// 	render: (data) => <span>{data.implementing_method}</span>,
		// },
		// {
		// 	key: "type",
		// 	label: "Type",
		// 	accessor: "type",
		// 	render: (data) => <span>{data.type}</span>,
		// },
		// {
		// 	key: "work_status",
		// 	label: "Work Status",
		// 	accessor: "work_status",
		// 	render: (data) => <span>{data.work_status}</span>,
		// },
		// {
		// 	key: "work_photo",
		// 	label: "Work Photo",
		// 	accessor: "work_photo",
		// 	render: (data) => (
		// 		<span>
		// 			<img
		// 				src={`${process.env.NEXT_PUBLIC_API_URL}/${data.work_photo}`}
		// 				alt={data.work_photo}
		// 			/>
		// 		</span>
		// 	),
		// },
		// {
		// 	key: "start_date",
		// 	label: "Work Start Date",
		// 	accessor: "start_date",
		// 	render: (data) => <span>{formatDate(data.start_date)}</span>,
		// },
		// {
		// 	key: "end_date",
		// 	label: "Work End Date",
		// 	accessor: "end_date",
		// 	render: (data) => <span>{formatDate(data.end_date)}</span>,
		// },
		// {
		// 	key: "worker_number",
		// 	label: "Work Number",
		// 	accessor: "worker_number",
		// 	render: (data) => <span>{data.worker_number}</span>,
		// },
		// {
		// 	key: "username",
		// 	label: "User ID",
		// 	accessor: "username",
		// 	render: (data) => <span>{data.username}</span>,
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
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<WorkStatusPieChart serverData={data} />
				<WorkTypePieCharts
					serverData={data}
					basicVillageData={data1}
				/>
			</div>

			{/* Data Table */}
			<div className="">
				<Searchtable
					data={data}
					inputfiled={[]}
					columns={columns}
					title="Work Status"
					filterOptions={filterOptions}
					searchKey="work_name"
					enableColumnSearch={true}
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
			<Modal open={!!selectedWork} onClose={() => setSelectedWork(null)} title={`Work Name: ${selectedWork?.work_name ?? ''}`}>
				{renderWorkModal()}
			</Modal>
		</div>
	);
};

export default Presetntwork;
