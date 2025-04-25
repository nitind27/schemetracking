"use client";

import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";

import { Schemesdatas } from "@/components/schemesdata/schemes";
import { Schemecategorytype } from "@/components/Schemecategory/Schemecategory";
import { Schemesubcategorytype } from "@/components/Schemesubcategory/Schemesubcategory";

interface DefaultModalProps {
    schemeid: number;
    farmername: string;
    datascheme: Schemesdatas[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
}

export default function SchemesDataModel({ schemeid, datascheme, farmername, schemescrud, schemessubcategory }: DefaultModalProps) {
    const { isOpen, openModal, closeModal } = useModal();

    const farmer = datascheme.find((data) => data.scheme_id === Number(schemeid));

    // Fields to exclude
    const excludedFields = ["scheme_id", "created_at", "updated_at"];

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
                            .map(([key, value]) => (
                                <div key={key} className="flex justify-between border-b pb-1">
                                    <span className="capitalize font-medium text-gray-700 dark:text-white">
                                        {key.replace(/_/g, " ") == "adivasi" ? "Type" : key.replace(/_/g, " ")}
                                        {/* {key == "adivasi" ? "1" : key} */}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {value ? value : "-"}
                                    </span>
                                </div>
                            ))}
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
