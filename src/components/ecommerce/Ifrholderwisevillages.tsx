"use client";
import React, { useEffect, useState } from "react";
import { UserCategory } from "../usercategory/userCategory";
import { Schemesdatas } from "../schemesdata/schemes";
import { FarmdersType } from "../farmersdata/farmers";
import { Schemecategorytype } from "../Schemecategory/Schemecategory";
import { Schemesubcategorytype } from "../Schemesubcategory/Schemesubcategory";
import { Scheme_year } from "../Yearmaster/yearmaster";
import { Documents } from "../Documentsdata/documents";
import { Taluka } from "../Taluka/Taluka";
import { Village } from "../Village/village";
import { Column } from "../tables/tabletype";
import { Simpletableshowdata } from "../tables/Simpletableshowdata";
import { FaCheck } from "react-icons/fa";

import { RiCloseLargeLine } from "react-icons/ri";
interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    yearmaster: Scheme_year[];
    documents: Documents[];
    taluka: Taluka[];
    villages: Village[];
}

const Ifrholderwisevillages = ({
    farmersData,
}: {
    farmersData: AllFarmersData;
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [filteredschemes, setFilteredschemes] = useState<FarmdersType[]>([]);
    const [filters, setFilters] = useState({
        talukaId: null as string | null,
        villageId: null as string | null,
        categoryName: null as string | null,
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setFilters({
            talukaId: sessionStorage.getItem("taluka_id"),
            villageId: sessionStorage.getItem("village_id"),
            categoryName: sessionStorage.getItem("category_id"),
        });
    }, []);

    // Filter villages by taluka
    const filteredVillages = farmersData.villages.filter(
        (village) => village.taluka_id === filters.talukaId
    );

    const handleBenefitedClick = (schemeId: number) => {
        const benefitedFarmers = farmersData.farmers.filter((data) => data.village_id == schemeId.toString())
        setModalTitle("IFR holders");
        setFilteredschemes(benefitedFarmers);
        setCurrentPage(1); // Reset to first page whenever modal opens
        setIsModalOpen(true);
    };

    // Define columns
    const columns: Column<Village>[] = [
        {
            key: "name",
            label: "Village Name",
            accessor: "name",
            render: (village) => <span>{village.name}</span>,
        },
        {
            key: "ifrs_holders",
            label: "Ifrs holders",
            accessor: "taluka_id", // Not used, but required by your table type
            render: (village) => {
                // Count matching farmers for this village
                const count = farmersData.farmers.filter(
                    (farmer) =>
                        farmer.village_id == String(village.village_id)
                ).length;
                return <span onClick={() => handleBenefitedClick(village.village_id)} className="cursor-pointer">{count}</span>;
            },
        },
    ];

    const handleclosemodel = () => {
        setFilteredschemes([])
        setIsModalOpen(false)
    }

    // Pagination calculation
    const totalItems = filteredschemes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = filteredschemes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    const getDocuments = (docValue: string | number) => {
        if (typeof docValue === "string" && docValue.includes(",")) {
            const ids = docValue.split(",").map(id => Number(id.trim()));
            const documentNames = ids.map(id => {
                const doc = farmersData.documents.find(sub => sub.id === id);
                return doc?.document_name || id.toString();
            });
            return documentNames.join(", ");
        } else {
            const id = typeof docValue === "string" ? Number(docValue) : docValue;
            const doc = farmersData.documents.find(sub => sub.id === id);
            return doc?.document_name || id.toString();
        }
    };
    return (
        <div>
            <Simpletableshowdata
                data={filteredVillages}
                inputfiled={
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1"></div>
                }
                columns={columns}
                title="User Category"
                filterOptions={[]}
                submitbutton={[]}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-4 z-99999">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{modalTitle}</h3>
                            <button
                                onClick={() => handleclosemodel()}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 ">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sr.No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Village
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Taluka
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gat_No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vanksetra
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nivas Seti
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aadhaar No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kisan Id
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Documents
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Schemes
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dob
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gender
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedData.map((farmer, index) => (
                                            <tr key={farmer.farmer_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.adivasi}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">

                                                    {farmersData.villages.find(v => v.village_id === Number(farmer.village_id))?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">

                                                    {farmersData.taluka.find(v => v.taluka_id === Number(farmer.taluka_id))?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.gat_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.vanksetra}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.nivas_seti}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.aadhaar_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.contact_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.kisan_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {/* {farmer.documents} */}
                                                    {getDocuments(farmer.documents)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.schemes}
                                                    {farmersData.schemes.find(s => s.scheme_id === Number(farmer.schemes))?.scheme_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.dob}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {farmer.genger}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap flex gap-4">
                                                    <span className="text-green-600 cursor-pointer">

                                                        <FaCheck />
                                                    </span>
                                                    <span className="text-red-600 font-bold cursor-pointer">
                                                        <RiCloseLargeLine />
                                                    </span>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </div>
                        </div>
                        {/* Pagination controls */}
                        <div className="flex items-center justify-between mt-4 p-5">
                            <div>
                                Showing {paginatedData.length} of {totalItems} records
                            </div>
                            <div>
                                <button
                                    onClick={handlePrev}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="mx-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ifrholderwisevillages;
