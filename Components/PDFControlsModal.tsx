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
      {/* Action buttons horizontal group */}
      <div className="flex flex-row items-center space-x-2 w-full mb-4">
        <button
          onClick={onAddText}
          disabled={isRendering}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm flex items-center justify-center text-2xl"
          title="Add Text"
        >
          🅰️
        </button>
        <button
          onClick={onAddSignature}
          disabled={isRendering}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm flex items-center justify-center text-2xl"
          title="Add Signature"
        >
          ✏️
        </button>
      </div>
      <button
        onClick={onCancel}
        className="w-full px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium shadow-sm whitespace-nowrap"
      >
        Cancel
      </button>
    </div>
  );
};

export default PDFControlsModal; 