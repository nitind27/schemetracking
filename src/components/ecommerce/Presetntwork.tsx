"use client";
import { useState } from "react";
import { Column } from "../tables/tabletype";
import React from "react";
import { basicdetailsofvillagetype, presentworktype } from "./Cfrtype/futurework";
import { Searchtable } from "../tables/Searchtable";
import WorkTypePieCharts from "./WorkTypePieCharts";
import WorkStatusPieChart from "./WorkStatusPieChart"; // Add this import
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

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

	// Helper function to ensure proper string encoding
	const safeString = (value: unknown): string => {
		if (value === null || value === undefined) return "N/A";
		return String(value);
	};

	// Export to Excel function with proper UTF-8 encoding for Marathi
	const exportToExcel = () => {
		const excelData = data.map((row, index) => {
			// Ensure all values are properly encoded as strings
			return {
				"Sr No": index + 1,
				"Taluka": safeString(row.taluka_name),
				"Grampanchayat": safeString(row.gp_name),
				"Village": safeString(row.village_name),
				"Work Name": safeString(row.work_name),
				"Total Area": safeString(row.total_area),
				"Estimated Amount": safeString(row.estimated_amount),
				"Department Name": safeString(row.department_name),
				"Implementing Method": safeString(row.implementing_method),
				"Type": safeString(row.type),
				"Work Status": safeString(row.work_status),
				"Start Date": formatDate(row.start_date),
				"End Date": formatDate(row.end_date),
				"Worker Number": safeString(row.worker_number),
				"Username": safeString(row.username),
			};
		});

		// Create worksheet with proper encoding
		const worksheet = XLSX.utils.json_to_sheet(excelData, {
			// Ensure proper encoding for Unicode characters
			cellDates: false,
			dateNF: 'yyyy-mm-dd'
		});

		// Set column widths for better readability
		const columnWidths = [
			{ wch: 8 },   // Sr No
			{ wch: 25 },  // Taluka
			{ wch: 25 },  // Grampanchayat
			{ wch: 25 },  // Village
			{ wch: 35 },  // Work Name
			{ wch: 15 },  // Total Area
			{ wch: 18 },  // Estimated Amount
			{ wch: 25 },  // Department Name
			{ wch: 25 },  // Implementing Method
			{ wch: 15 },  // Type
			{ wch: 18 },  // Work Status
			{ wch: 15 },  // Start Date
			{ wch: 15 },  // End Date
			{ wch: 15 },  // Worker Number
			{ wch: 20 },  // Username
		];
		worksheet['!cols'] = columnWidths;

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Work Status");

		// Generate filename
		const fileName = `Work_Status_${new Date().toISOString().split('T')[0]}.xlsx`;
		
		// Write file - XLSX format natively supports UTF-8
		XLSX.writeFile(workbook, fileName);
	};

	// Export to PDF function with proper Unicode support for Marathi using HTML table with pagination
	const exportToPDF = async () => {
		try {
			// Dynamically import html2canvas
			const html2canvas = (await import('html2canvas')).default;
			
			// Create PDF in landscape mode
			const doc = new jsPDF('l', 'mm', 'a4');
			const pageWidth = 297; // A4 landscape width in mm
			const pageHeight = 210; // A4 landscape height in mm
			const maxRowsPerPage = 25; // Approximate rows per page
			
			// Split data into chunks for pagination
			const totalPages = Math.ceil(data.length / maxRowsPerPage);
			
			for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
			const startIndex = pageIndex * maxRowsPerPage;
			const endIndex = Math.min(startIndex + maxRowsPerPage, data.length);
			const pageData = data.slice(startIndex, endIndex);
			
			// Create a temporary container for the table
			const tempDiv = document.createElement('div');
			tempDiv.style.position = 'absolute';
			tempDiv.style.left = '-9999px';
			tempDiv.style.top = '0';
			tempDiv.style.width = '1200px';
			tempDiv.style.backgroundColor = 'white';
			tempDiv.style.padding = '20px';
			tempDiv.style.fontFamily = 'Arial, sans-serif';
			
			// Create table HTML with proper Marathi text support
			const tableHTML = `
				<div style="font-family: Arial, sans-serif; width: 100%;">
					<h2 style="text-align: center; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Work Status Report</h2>
					<div style="margin-bottom: 10px; font-size: 12px; text-align: center;">
						Page ${pageIndex + 1} of ${totalPages} | Total Records: ${data.length}
					</div>
					<table style="width: 100%; border-collapse: collapse; font-size: 9px;">
						<thead>
							<tr style="background-color: #2980b9; color: white;">
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Sr No</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Taluka</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Grampanchayat</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Village</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Work Name</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Type</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Work Status</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">Start Date</th>
								<th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold;">End Date</th>
							</tr>
						</thead>
						<tbody>
							${pageData.map((row, idx) => {
								const globalIndex = startIndex + idx;
								return `
									<tr style="background-color: ${globalIndex % 2 === 0 ? '#f9f9f9' : 'white'};">
										<td style="border: 1px solid #ddd; padding: 5px;">${globalIndex + 1}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.taluka_name)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.gp_name)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.village_name)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.work_name)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.type)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${safeString(row.work_status)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${formatDate(row.start_date)}</td>
										<td style="border: 1px solid #ddd; padding: 5px;">${formatDate(row.end_date)}</td>
									</tr>
								`;
							}).join('')}
						</tbody>
					</table>
				</div>
			`;
			
			tempDiv.innerHTML = tableHTML;
			document.body.appendChild(tempDiv);
			
			try {
				// Convert HTML to canvas with proper rendering
				const canvas = await html2canvas(tempDiv, {
					scale: 2,
					useCORS: true,
					allowTaint: false,
					backgroundColor: '#ffffff',
					logging: false,
				});
				
				// Remove temporary div
				document.body.removeChild(tempDiv);
				
				// Calculate image dimensions to fit page
				const imgWidth = pageWidth;
				const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pageHeight);
				
				// Add new page if not first page
				if (pageIndex > 0) {
					doc.addPage();
				}
				
				// Add image to PDF
				const imgData = canvas.toDataURL('image/png');
				doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
				
			} catch (error) {
				// Remove temporary div in case of error
				if (document.body.contains(tempDiv)) {
					document.body.removeChild(tempDiv);
				}
				console.error('Error generating PDF page:', error);
				throw error;
			}
			}
			
			// Save PDF
			const fileName = `Work_Status_${new Date().toISOString().split('T')[0]}.pdf`;
			doc.save(fileName);
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('PDF generation failed. Please try again.');
		}
	};

	// Export to CSV with UTF-8 BOM for proper Marathi text support
	const exportToCSV = () => {
		// CSV headers
		const headers = [
			"Sr No", "Taluka", "Grampanchayat", "Village", "Work Name", 
			"Total Area", "Estimated Amount", "Department Name", 
			"Implementing Method", "Type", "Work Status", 
			"Start Date", "End Date", "Worker Number", "Username"
		];

		// Convert data to CSV rows
		const csvRows = data.map((row, index) => [
			index + 1,
			safeString(row.taluka_name),
			safeString(row.gp_name),
			safeString(row.village_name),
			safeString(row.work_name),
			safeString(row.total_area),
			safeString(row.estimated_amount),
			safeString(row.department_name),
			safeString(row.implementing_method),
			safeString(row.type),
			safeString(row.work_status),
			formatDate(row.start_date),
			formatDate(row.end_date),
			safeString(row.worker_number),
			safeString(row.username),
		]);

		// Escape CSV values (handle commas and quotes)
		const escapeCSV = (value: unknown): string => {
			const str = safeString(value);
			if (str.includes(',') || str.includes('"') || str.includes('\n')) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		};

		// Build CSV content
		const csvContent = [
			headers.map(escapeCSV).join(','),
			...csvRows.map(row => row.map(escapeCSV).join(','))
		].join('\n');

		// Add UTF-8 BOM for proper encoding in Excel
		const BOM = '\uFEFF';
		const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
		
		// Create download link
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `Work_Status_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

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
				<div className="mb-4 flex justify-end gap-3 flex-wrap">
					<button
						onClick={exportToExcel}
						className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
						Export to Excel
					</button>
					<button
						onClick={exportToCSV}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
						Export to CSV
					</button>
					<button
						onClick={exportToPDF}
						className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
								clipRule="evenodd"
							/>
						</svg>
						Export to PDF
					</button>
				</div>
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
