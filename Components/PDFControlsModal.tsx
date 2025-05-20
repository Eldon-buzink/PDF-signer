import React from 'react';

interface PDFControlsModalProps {
  currentPage: number;
  numPages: number;
  scale: number;
  isRendering: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCancel: () => void;
  onAddText: () => void;
  onAddSignature: () => void;
  onClose: () => void;
}

const PDFControlsModal: React.FC<PDFControlsModalProps> = ({
  currentPage,
  numPages,
  scale,
  isRendering,
  onPrevious,
  onNext,
  onZoomIn,
  onZoomOut,
  onCancel,
  onAddText,
  onAddSignature,
  onClose,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col items-center p-6 min-w-[260px] max-w-full w-[320px]">
      {/* Page number at the top */}
      <span className="font-medium text-gray-700 mb-4 text-center">
        Page {currentPage} of {numPages}
      </span>
      {/* Navigation buttons: Previous/Next row */}
      <div className="flex flex-row items-center space-x-2 w-full mb-2">
        <button
          onClick={onPrevious}
          disabled={currentPage <= 1 || isRendering}
          className="w-1/2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 whitespace-nowrap"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentPage >= numPages || isRendering}
          className="w-1/2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 whitespace-nowrap"
        >
          Next →
        </button>
      </div>
      {/* Zoom row: - 100% + */}
      <div className="flex flex-row items-center space-x-2 w-full mb-4">
        <button
          onClick={onZoomOut}
          disabled={isRendering}
          className="w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 whitespace-nowrap"
        >
          –
        </button>
        <span className="w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 whitespace-nowrap text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={isRendering}
          className="w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 whitespace-nowrap"
        >
          +
        </button>
      </div>
      {/* Action buttons vertical group with extra spacing */}
      <div className="flex flex-col items-center space-y-2 w-full mt-2">
        <button
          onClick={onAddText}
          disabled={isRendering}
          className="w-full min-w-[110px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm whitespace-nowrap"
        >
          Add Text
        </button>
        <button
          onClick={onAddSignature}
          disabled={isRendering}
          className="w-full min-w-[130px] px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm whitespace-nowrap"
        >
          Add Signature
        </button>
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium shadow-sm whitespace-nowrap mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PDFControlsModal; 