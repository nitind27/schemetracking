"use client";

import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { toast } from "react-toastify";

interface DefaultModalProps {
  id: number;
  fetchData: () => void;
  endpoint:string;
  bodyname:string;
}

export default function DefaultModal({ id, fetchData ,endpoint,bodyname}: DefaultModalProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyname]: id }),
      });

      if (response.ok) {
        toast.success("Deleted successfully!");
        fetchData();
        closeModal();
      } else {
        toast.error("Failed to delete.");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("An error occurred while deleting.");
    }
  };

  return (
    <div>
      <Button size="sm" onClick={openModal}>
        Delete
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <h4 className="font-semibold text-gray-800 mb-7 text-title-sm dark:text-white/90">
          Confirmation
        </h4>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          Are you sure you want to delete ?
        </p>

        <div className="flex items-center justify-end w-full gap-3 mt-8">
          <Button size="sm" variant="outline" onClick={closeModal}>
            Close
          </Button>
          <Button size="sm" onClick={handleDelete}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
