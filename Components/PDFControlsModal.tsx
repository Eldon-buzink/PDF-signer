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
  onDownload: () => void;
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
  onDownload,
  onAddText,
  onAddSignature,
  onClose,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col items-center p-4 md:p-6 w-full md:min-w-[260px] md:max-w-[320px]">
      {/* Zoom row: - 100% + */}
      <div className="flex flex-row items-center space-x-2 w-full mb-3">
        <button
          onClick={onZoomOut}
          disabled={isRendering}
          className="flex-1 h-8 md:h-10 px-0 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 whitespace-nowrap text-base flex items-center justify-center"
        >
          –
        </button>
        <span className="flex-1 h-8 md:h-10 flex items-center justify-center px-0 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 whitespace-nowrap text-center text-base">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={isRendering}
          className="flex-1 h-8 md:h-10 px-0 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 whitespace-nowrap text-base flex items-center justify-center"
        >
          +
        </button>
      </div>
      
      {/* Action buttons in a single row */}
      <div className="flex flex-row items-center space-x-2 w-full">
        <button
          onClick={onAddText}
          disabled={isRendering}
          className="flex-1 h-10 md:h-12 px-0 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm flex items-center justify-center text-xl md:text-2xl"
          title="Add Text"
        >
          <span className="flex items-center justify-center w-full text-xl md:text-2xl">🅰️</span>
        </button>
        <button
          onClick={onAddSignature}
          disabled={isRendering}
          className="flex-1 h-10 md:h-12 px-0 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm flex items-center justify-center text-xl md:text-2xl"
          title="Add Signature"
        >
          <span className="flex items-center justify-center w-full text-xl md:text-2xl">✏️</span>
        </button>
        <button
          onClick={onDownload}
          className="flex-1 h-10 md:h-12 px-0 text-white bg-green-600 hover:bg-green-700 border border-green-700 rounded-lg font-medium shadow-sm whitespace-nowrap flex items-center justify-center gap-2 md:gap-3"
        >
          <span className="flex items-center justify-center text-xl md:text-2xl leading-none">⬇️</span>
          <span className="text-xs md:text-sm font-semibold flex items-center leading-none">Download</span>
        </button>
      </div>
    </div>
  );
};

export default PDFControlsModal; 