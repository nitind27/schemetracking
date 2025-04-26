"use client";

import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";

import { Schemesdatas } from "@/components/schemesdata/schemes";
import { Schemecategorytype } from "@/components/Schemecategory/Schemecategory";
import { Schemesubcategorytype } from "@/components/Schemesubcategory/Schemesubcategory";

import { Scheme_year } from "@/components/Yearmaster/yearmaster";
import { Documents } from "@/components/Documentsdata/documents";

interface DefaultModalProps {
    schemeid: number;
    farmername: string;
    datascheme: Schemesdatas[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    dataschemsyear: Scheme_year[];
    datadocuments: Documents[];
}

export default function SchemesDataModel({ schemeid, datascheme, farmername, schemescrud, schemessubcategory, dataschemsyear, datadocuments }: DefaultModalProps) {
    const { isOpen, openModal, closeModal } = useModal();

    const farmer = datascheme.find((data) => data.scheme_id === Number(schemeid));

    // Fields to exclude
    const excludedFields = ["scheme_id", "created_at", "updated_at"];

    const getCategoryName = (id: number) => {
        const category = schemescrud.find(cat => cat.scheme_category_id == id);

        return category?.name || id.toString();
    };

    const getSubcategoryName = (id: number) => {
        const subcategory = schemessubcategory.find(sub => sub.scheme_sub_category_id == id);
        return subcategory?.name || id.toString();
    };

    const getSchemeyear = (id: number) => {
        const subcategory = dataschemsyear.find(sub => sub.scheme_year_id == id);
        return subcategory?.year || id.toString();
    };

    const getDocuments = (ids: number | number[]) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        
        // Get all found IDs from the dataset
        const foundIds = datadocuments
            .filter(sub => idArray.includes(sub.id))
            .map(sub => sub.id);
    
        // Combine found IDs with missing IDs
        const allIds = [
            ...foundIds,
            ...idArray.filter(id => !foundIds.includes(id))
        ];
    
        return allIds.join(', ');
    };
    
    return (
        <div>
            <span className="cursor-pointer hover:text-blue-700 underline" onClick={openModal}>
                {farmername}
            </span>

            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                className="max-w-[600px] p-5 lg:p-10"
            >
                <h4 className="font-semibold text-gray-800 mb-4 text-xl dark:text-white">
                    IFR holder
                </h4>

                {farmer ? (
                    <div className="max-h-[60vh] overflow-y-auto space-y-4">
                        {Object.entries(farmer)
                            .filter(([key]) => !excludedFields.includes(key))
                            .map(([key, value]) => {
                                // Convert IDs to names for specific fields
                                let displayValue: React.ReactNode = value || "-";

                                if (key == "scheme_year_id") {
                                    displayValue = getSchemeyear(value);
                                }
                                if (key == "scheme_category_id") {
                                    displayValue = getCategoryName(value);
                                }

                                if (key == "scheme_sub_category_id") {
                                    displayValue = getSubcategoryName(value);
                                }
                                if (key == "documents") {
                                    displayValue = getDocuments(value);
                                }

                                return (
                                    <div key={key} className="flex justify-between border-b pb-1">
                                        <span className="capitalize font-medium text-gray-700 dark:text-white">
                                            {key.replace(/_/g, " ") === "adivasi"
                                                ? "Type"
                                                : key.replace(/_/g, " ")
                                            }

                                        </span>
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {displayValue}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No data found for this farmer.
                    </p>
                )}

                <div className="flex items-center justify-end w-full gap-3 mt-6">
                    <Button size="sm" variant="outline" onClick={closeModal}>
                        Close
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
