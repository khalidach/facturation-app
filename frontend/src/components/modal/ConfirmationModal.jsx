import React from "react";
import Modal from "@/components/Modal.jsx";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
