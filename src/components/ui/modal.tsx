"use client";
import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean; // New prop to control close button visibility
  isFullscreen?: boolean; // Default to false for backwards compatibility
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  // showCloseButton = true, // Default to true for backwards compatibility
  isFullscreen = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-5 h-full"
    : "relative w-full max-w-2xl mx-auto rounded-3xl bg-white dark:bg-gray-900 max-h-[calc(100vh-2rem)] overflow-y-auto";

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      {/* Centering wrapper - viewport height, modal always visible in center */}
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        {!isFullscreen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-md backdrop-saturate-150 -z-[1]"
            onClick={onClose}
            aria-hidden
          />
        )}
        <div
          ref={modalRef}
          className={`${contentClasses} ${className} relative z-0`}
          onClick={(e) => e.stopPropagation()}
        >
          <div>{children}</div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};
