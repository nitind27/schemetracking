"use client";

import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { FarmdersType } from "@/components/farmersdata/farmers";

interface DefaultModalProps {
  farmersid: string;
  farmername: string;
  datafarmers: FarmdersType[];
}

export default function UserDatamodel({ farmersid, datafarmers, farmername }: DefaultModalProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const farmer = datafarmers.find((data) => data.farmer_id === Number(farmersid));

  // Fields to exclude
  const excludedFields = ["farmer_id", "created_at", "updated_at"];

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
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full border text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b font-semibold text-gray-700 dark:text-white">Sr.No</th>
                  <th className="px-4 py-2 border-b font-semibold text-gray-700 dark:text-white">Field</th>
                  <th className="px-4 py-2 border-b font-semibold text-gray-700 dark:text-white">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(farmer)
                  .filter(([key]) => !excludedFields.includes(key))
                  .map(([key, value], index) => (
                    <tr key={key}>
                      <td className="px-4 py-2 border-b capitalize font-medium text-gray-700 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-b capitalize font-medium text-gray-700 dark:text-white">
                        {key.replace(/_/g, " ") === "adivasi" ? "Type" : key.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2 border-b text-gray-600 dark:text-gray-300">
                        {value ? value : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
