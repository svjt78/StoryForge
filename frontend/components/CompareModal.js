// frontend/components/CompareModal.js
import React from 'react';
import { diffLines } from 'diff';

export default function CompareModal({ oldText, newText, onClose }) {
  // Compute the diff using jsdiff
  const diff = diffLines(oldText, newText);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg p-6 w-full max-w-6xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl font-bold text-gray-700 hover:text-black"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">Compare Versions</h2>
        <div className="font-mono text-sm whitespace-pre-wrap">
          {diff.map((part, index) => {
            let className = "";
            if (part.added) {
              className = "bg-green-100 text-green-800";
            } else if (part.removed) {
              className = "bg-red-100 text-red-800";
            }
            return (
              <span key={index} className={className}>
                {part.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
