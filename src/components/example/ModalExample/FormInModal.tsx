"use client";
import React from "react";


import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";

import { useModal } from "@/hooks/useModal";

export default function FormInModal({
  inputfiled,
  title,
  submitbutton
}: {
  inputfiled: any;
  title: any;
  submitbutton: any;
}) {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>

      <Button size="sm" onClick={openModal}>
        Add
      </Button>

      <Modal
        isOpen={isOpen}

        onClose={closeModal}
        className="max-w-[584px] p-5 lg:p-10 h-[550px] overflow-y-auto scrollbar-hide"
      >
        <form className="">
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90 ">
            {title}
          </h4>

          {inputfiled}

          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>

            {submitbutton}
          </div>
        </form>
      </Modal>
    </>

  );
}
