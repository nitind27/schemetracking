"use client";
import { useState, useMemo } from "react";
// import { Column } from "../tables/tabletype";
import React from "react";
import { basicdetailsofvillagetype, presentworktype } from "./Cfrtype/futurework";
import DataTable from "react-data-table-component";
import WorkTypePieCharts from "./WorkTypePieCharts";
import WorkStatusPieChart from "./WorkStatusPieChart"; // Add this import
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

// --- Modal Implementation ---
function Modal({ open, onClose, title, children, size = "max-w-4xl" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: string; }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 bg-black/40 bg-opacity-40 flex z-99999 items-center justify-center">
			<div className={`bg-white rounded-lg shadow-xl ${size} w-full mx-3 p-6 relative`}>
				<button className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-red-500 font-bold" onClick={onClose}>&times;</button>
				<h3 className="mb-4 text-lg font-bold text-center">{title}</h3>
				<div className="overflow-auto max-h-[70vh]">{children}</div>
			</div>
		</div>
	);
}

// Type for grouped work data
type GroupedWorkType = {
	key: string;
	taluka_name: string;
	gp_name: string;
	village_name: string;
	works: presentworktype[];
	count: number;
	type: string; // For filtering - contains types like "Plantation, NRM" or single type
	work_status: string; // For filtering - contains statuses
};

interface Props {
	serverData: presentworktype[];
	basicVillageData: basicdetailsofvillagetype[];
}

const Presetntwork: React.FC<Props> = ({ serverData, basicVillageData }) => {
	const [data] = useState<presentworktype[]>(serverData || []);
	const [data1] = useState<basicdetailsofvillagetype[]>(basicVillageData || []);
	const [selectedWork, setSelectedWork] = useState<presentworktype | null>(null); // <-- NEW
	const [selectedGroup, setSelectedGroup] = useState<GroupedWorkType | null>(null); // For grouped works modal

	// Cascading filter states
	const [filters, setFilters] = useState<Record<string, string>>({});
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	console.log("serverData", data1);

	// Group works by taluka + village + grampanchayat
	const groupedData = useMemo(() => {
		const groups = new Map<string, GroupedWorkType>();

		data.forEach((work) => {
			const key = `${work.taluka_name || ''}_${work.village_name || ''}_${work.gp_name || ''}`;

			if (groups.has(key)) {
				const existing = groups.get(key)!;
				existing.works.push(work);
				existing.count = existing.works.length;
			} else {
				groups.set(key, {
					key,
					taluka_name: work.taluka_name || '',
					gp_name: work.gp_name || '',
					village_name: work.village_name || '',
					works: [work],
					count: 1,
					type: '', // Will be calculated after
					work_status: '', // Will be calculated after
				});
			}
		});

		// Calculate type and work_status for each group (for filtering)
		groups.forEach((group) => {
			const types = [...new Set(group.works.map(w => w.type).filter(Boolean))];
			const statuses = [...new Set(group.works.map(w => w.work_status).filter(Boolean))];
			group.type = types.join(', ');
			group.work_status = statuses.join(', ');
		});

		return Array.from(groups.values());
	}, [data]);
	function formatDate(dateString: string | undefined | null): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'N/A';
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	}

	// Function to open Google Maps with coordinates
	const openGoogleMaps = (latitude: string | number | undefined, longitude: string | number | undefined) => {
		if (!latitude || !longitude) return;
		
		const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
		const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
		
		if (isNaN(lat) || isNaN(lng)) return;
		
		// Open Google Maps in new tab
		const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
		window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
	};

	// Check if work has valid coordinates
	const hasValidCoordinates = (work: presentworktype): boolean => {
		if (!work.latitude || !work.longitude) return false;
		const lat = typeof work.latitude === 'string' ? parseFloat(work.latitude) : work.latitude;
		const lng = typeof work.longitude === 'string' ? parseFloat(work.longitude) : work.longitude;
		return !isNaN(lat) && !isNaN(lng);
	};
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
				{/* Map Button - Show if coordinates are available */}
				{hasValidCoordinates(selectedWork) && (
					<div className="mb-4 flex justify-center">
						<button
							onClick={() => openGoogleMaps(selectedWork.latitude, selectedWork.longitude)}
							className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-medium"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Open Location in Google Maps
						</button>
					</div>
				)}
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

	// DataTable columns for grouped data
	const reactColumns = useMemo(() => [
		{
			name: "SR No.",
			cell: (_row: GroupedWorkType, index: number) => perPage * (currentPage - 1) + index + 1,
			width: "80px",
		},
		{
			name: "Taluka",
			selector: (row: GroupedWorkType) => row.taluka_name || '',
			cell: (row: GroupedWorkType) => <span className="font-medium">{row.taluka_name || 'N/A'}</span>,
			sortable: true,
		},
		{
			name: "Grampanchayat",
			selector: (row: GroupedWorkType) => row.gp_name || '',
			cell: (row: GroupedWorkType) => <span className="font-medium">{row.gp_name || 'N/A'}</span>,
			sortable: true,
		},
		{
			name: "Village",
			selector: (row: GroupedWorkType) => row.village_name || '',
			cell: (row: GroupedWorkType) => <span className="font-medium">{row.village_name || 'N/A'}</span>,
			sortable: true,
		},
		{
			name: "Work Count",
			cell: (row: GroupedWorkType) => (
				<span
					className="cursor-pointer underline text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
					onClick={() => setSelectedGroup(row)}
				>
					{row.count} {row.count === 1 ? 'Work' : 'Works'}
				</span>
			),
			sortable: false,
		},
	], [perPage, currentPage]);

	// Render grouped works modal with table
	const renderGroupedWorksModal = () => {
		if (!selectedGroup) return null;

		return (
			<div className="space-y-4">
				<div className="bg-gray-50 p-3 rounded-lg mb-4">
					<div className="grid grid-cols-3 gap-4 text-sm">
						<div><span className="font-semibold">Taluka:</span> {selectedGroup.taluka_name || 'N/A'}</div>
						<div><span className="font-semibold">Grampanchayat:</span> {selectedGroup.gp_name || 'N/A'}</div>
						<div><span className="font-semibold">Village:</span> {selectedGroup.village_name || 'N/A'}</div>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full border-collapse border border-gray-300">
						<thead>
							<tr className="bg-blue-600 text-white">
								<th className="border border-gray-300 px-4 py-2 text-left">Sr No</th>
								<th className="border border-gray-300 px-4 py-2 text-left">Work Name</th>
								<th className="border border-gray-300 px-4 py-2 text-left">Type</th>
								<th className="border border-gray-300 px-4 py-2 text-left">Status</th>
								<th className="border border-gray-300 px-4 py-2 text-left">Start Date</th>
								<th className="border border-gray-300 px-4 py-2 text-left">End Date</th>
								<th className="border border-gray-300 px-4 py-2 text-left">Map</th>
								<th className="border border-gray-300 px-4 py-2 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							{selectedGroup.works.map((work, index) => (
								<tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
									<td className="border border-gray-300 px-4 py-2">{index + 1}</td>
									<td className="border border-gray-300 px-4 py-2 font-medium">{work.work_name || 'N/A'}</td>
									<td className="border border-gray-300 px-4 py-2">
										<span className={`px-2 py-1 rounded text-xs font-medium ${work.type === 'Plantation' ? 'bg-green-100 text-green-800' :
												work.type === 'NRM' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
											}`}>
											{work.type || 'N/A'}
										</span>
									</td>
									<td className="border border-gray-300 px-4 py-2">
										<span className={`px-2 py-1 rounded text-xs font-medium ${work.work_status === 'Completed' ? 'bg-green-100 text-green-800' :
												work.work_status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
													work.work_status === 'Pending' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
											}`}>
											{work.work_status || 'N/A'}
										</span>
									</td>
									<td className="border border-gray-300 px-4 py-2">{formatDate(work.start_date)}</td>
									<td className="border border-gray-300 px-4 py-2">{formatDate(work.end_date)}</td>
									<td className="border border-gray-300 px-4 py-2 text-center">
										{hasValidCoordinates(work) ? (
											<button
												onClick={() => openGoogleMaps(work.latitude, work.longitude)}
												className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 shadow-md hover:shadow-lg"
												title={`Open ${work.work_name} location in Google Maps`}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={2}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
													/>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
													/>
												</svg>
											</button>
										) : (
											<span className="text-gray-400 text-xs">N/A</span>
										)}
									</td>
									<td className="border border-gray-300 px-4 py-2">
										<button
											className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
											onClick={() => {
												setSelectedGroup(null);
												setSelectedWork(work);
											}}
										>
											View Details
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	};


	// Cascading filter options from grouped data
	const cascadingFilterOptions = useMemo(() => {
		// Get all taluka options
		const talukaOptions = Array.from(
			new Set(groupedData.map(item => item.taluka_name).filter(Boolean))
		).sort().map(taluka => ({ label: taluka, value: taluka }));

		// Get grampanchayat options based on selected taluka
		let gpData = groupedData;
		if (filters["Taluka"]) {
			gpData = groupedData.filter(item => item.taluka_name === filters["Taluka"]);
		}
		const gpOptions = Array.from(
			new Set(gpData.map(item => item.gp_name).filter(Boolean))
		).sort().map(gp => ({ label: gp, value: gp }));

		// Get village options based on selected taluka and grampanchayat
		let villageData = groupedData;
		if (filters["Taluka"]) {
			villageData = villageData.filter(item => item.taluka_name === filters["Taluka"]);
		}
		if (filters["Grampanchayat"]) {
			villageData = villageData.filter(item => item.gp_name === filters["Grampanchayat"]);
		}
		const villageOptions = Array.from(
			new Set(villageData.map(item => item.village_name).filter(Boolean))
		).sort().map(village => ({ label: village, value: village }));

		return {
			talukaOptions,
			gpOptions,
			villageOptions
		};
	}, [groupedData, filters]);

	// Filtered grouped data based on cascading filters
	const filteredGroupedData = useMemo(() => {
		// Check if any filter or search is applied
		const hasActiveFilters = Object.values(filters).some(filter => filter) || search;

		// If no filters are applied, return empty array
		if (!hasActiveFilters) {
			return [];
		}

		let tempData = [...groupedData];

		// Apply Taluka filter
		if (filters["Taluka"]) {
			tempData = tempData.filter(row => row.taluka_name === filters["Taluka"]);
		}

		// Apply Grampanchayat filter
		if (filters["Grampanchayat"]) {
			tempData = tempData.filter(row => row.gp_name === filters["Grampanchayat"]);
		}

		// Apply Village filter
		if (filters["Village"]) {
			tempData = tempData.filter(row => row.village_name === filters["Village"]);
		}

		// Apply Type filter - check if any work in the group has this type
		if (filters["Type"]) {
			tempData = tempData.filter(row =>
				row.works.some(work => work.type === filters["Type"])
			);
		}

		// Apply Work Status filter - check if any work in the group has this status
		if (filters["WorkStatus"]) {
			tempData = tempData.filter(row =>
				row.works.some(work => work.work_status === filters["WorkStatus"])
			);
		}

		// Apply search
		if (search) {
			tempData = tempData.filter(row =>
				row.village_name?.toLowerCase().includes(search.toLowerCase()) ||
				row.taluka_name?.toLowerCase().includes(search.toLowerCase()) ||
				row.gp_name?.toLowerCase().includes(search.toLowerCase())
			);
		}

		return tempData;
	}, [groupedData, filters, search]);

	// Clear all filters
	const clearAllFilters = () => {
		setFilters({});
		setSearch("");
		setCurrentPage(1);
	};

	// SubHeader component with cascading filters
	const SubHeaderComponent = (
		<div className="space-y-4 w-full">
			<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
				{/* Filter Controls */}
				<div className="flex flex-col sm:flex-row gap-3 flex-wrap">
					{/* Taluka Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700 text-left">तालुका</label>
						<select
							className="border rounded px-3 py-2 min-w-[180px] bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							value={filters["Taluka"] || ""}
							onChange={(e) => {
								setFilters({
									"Taluka": e.target.value,
									"Grampanchayat": "",
									"Village": "",
									"Type": filters["Type"] || "",
									"WorkStatus": filters["WorkStatus"] || ""
								});
								setCurrentPage(1);
							}}
						>
							<option value="">तालुका निवडा</option>
							{cascadingFilterOptions.talukaOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
					</div>

					{/* Grampanchayat Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700 text-left">ग्रामपंचायत</label>
						<select
							className="border rounded px-3 py-2 min-w-[180px] bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							value={filters["Grampanchayat"] || ""}
							onChange={(e) => {
								setFilters(prev => ({
									...prev,
									"Grampanchayat": e.target.value,
									"Village": ""
								}));
								setCurrentPage(1);
							}}
						>
							<option value="">ग्रामपंचायत निवडा</option>
							{cascadingFilterOptions.gpOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
					</div>

					{/* Village Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700 text-left">गाव</label>
						<select
							className="border rounded px-3 py-2 min-w-[180px] bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							value={filters["Village"] || ""}
							onChange={(e) => {
								setFilters(prev => ({ ...prev, "Village": e.target.value }));
								setCurrentPage(1);
							}}
						>
							<option value="">गाव निवडा</option>
							{cascadingFilterOptions.villageOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
					</div>

					{/* Type Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700 text-left">Type</label>
						<select
							className="border rounded px-3 py-2 min-w-[150px] bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							value={filters["Type"] || ""}
							onChange={(e) => {
								setFilters(prev => ({ ...prev, "Type": e.target.value }));
								setCurrentPage(1);
							}}
						>
							<option value="">All Types</option>
							<option value="Plantation">Plantation</option>
							<option value="NRM">NRM</option>
						</select>
					</div>

					{/* Work Status Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700 text-left">Work Status</label>
						<select
							className="border rounded px-3 py-2 min-w-[150px] bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							value={filters["WorkStatus"] || ""}
							onChange={(e) => {
								setFilters(prev => ({ ...prev, "WorkStatus": e.target.value }));
								setCurrentPage(1);
							}}
						>
							<option value="">All Status</option>
							<option value="Pending">Pending</option>
							<option value="In Progress">In Progress</option>
							<option value="Completed">Completed</option>
						</select>
					</div>
				</div>


			</div>
			{/* Search and Actions */}
			<div className="flex flex-col sm:flex-row gap-3 items-center">
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium text-gray-700 text-left">Search</label>
					<input
						type="text"
						placeholder="Search..."
						className="rounded border border-gray-200 bg-white px-3 py-2 hover:shadow-sm transition-shadow focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>
				<button
					onClick={clearAllFilters}
					className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200 text-sm mt-5"
				>
					Clear Filters
				</button>
			</div>
			{/* Results Summary */}
			<div className="flex justify-between items-center text-sm text-gray-600">
				<span>
					Showing {filteredGroupedData.length} of {groupedData.length} locations
				</span>
			</div>
		</div>
	);

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
				<div className="p-4 rounded-lg w-full border bg-white shadow-sm">
					<div className="mb-4">
						<h2 className="text-xl font-semibold text-gray-800">CFR क्षेत्रातील झालेल्या / सुरू असलेल्या कामांची माहिती</h2>
					</div>

					<DataTable
						columns={reactColumns}
						data={filteredGroupedData}
						pagination
						highlightOnHover
						responsive
						striped
						persistTableHead
						subHeader
						subHeaderComponent={SubHeaderComponent}
						paginationPerPage={perPage}
						paginationDefaultPage={currentPage}
						onChangePage={(page) => setCurrentPage(page)}
						onChangeRowsPerPage={(newPerPage) => {
							setPerPage(newPerPage);
							setCurrentPage(1);
						}}
						customStyles={{
							rows: {
								style: {
									minHeight: "48px",
								},
							},
							headCells: {
								style: {
									fontWeight: "600",
									fontSize: "14px",
									border: "1px solid #ddd",
									backgroundColor: "#f8f9fa",
								},
							},
							cells: {
								style: {
									border: "1px solid #ddd",
								},
							},
							subHeader: {
								style: {
									backgroundColor: "#f8f9fa",
									borderBottom: "1px solid #ddd",
								},
							},
						}}
						noDataComponent={
							<div className="text-center py-8">
								{Object.values(filters).some(filter => filter) || search ? (
									<>
										<p className="text-gray-500 text-lg">कोणताही डेटा सापडला नाही</p>
										<p className="text-gray-400 text-sm mt-2">आपण निवडलेल्या फिल्टरनुसार कोणताही डेटा नाही</p>
										<button
											onClick={clearAllFilters}
											className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
										>
											फिल्टर साफ करा
										</button>
									</>
								) : (
									<>
										<p className="text-gray-500 text-lg">कोणताही डेटा उपलब्ध नाही</p>
										<p className="text-gray-400 text-sm mt-2">कृपया फिल्टर वापरून डेटा शोधा</p>
									</>
								)}
							</div>
						}
					/>
				</div>
			</div>
			{/* Grouped Works Modal */}
			<Modal
				open={!!selectedGroup}
				onClose={() => setSelectedGroup(null)}
				title={`Works in ${selectedGroup?.village_name || ''} (${selectedGroup?.count || 0} Works)`}
				size="max-w-6xl"
			>
				{renderGroupedWorksModal()}
			</Modal>

			{/* Single Work Details Modal */}
			<Modal open={!!selectedWork} onClose={() => setSelectedWork(null)} title={`Work Name: ${selectedWork?.work_name ?? ''}`}>
				{renderWorkModal()}
			</Modal>
		</div>
	);
};

export default Presetntwork;
