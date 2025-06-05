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
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col items-center p-4 md:p-6 w-full md:min-w-[280px] md:max-w-[320px] space-y-4">
      {/* Page Navigation */}
      <div className="flex items-center justify-between w-full bg-gray-50 rounded-xl p-2">
        <button
          onClick={onPrevious}
          disabled={currentPage <= 1 || isRendering}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 transition-colors duration-150"
          title="Previous Page"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={onNext}
          disabled={currentPage >= numPages || isRendering}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 transition-colors duration-150"
          title="Next Page"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-between w-full bg-gray-50 rounded-xl p-2">
        <button
          onClick={onZoomOut}
          disabled={isRendering}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 transition-colors duration-150"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={isRendering}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 transition-colors duration-150"
          title="Zoom In"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          onClick={onAddText}
          disabled={isRendering}
          className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors duration-150 disabled:opacity-50"
          title="Add Text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm font-medium">Add Text</span>
        </button>
        <button
          onClick={onAddSignature}
          disabled={isRendering}
          className="flex items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors duration-150 disabled:opacity-50"
          title="Add Signature"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="text-sm font-medium">Sign</span>
        </button>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-150"
        title="Download PDF"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="text-sm font-medium">Download PDF</span>
      </button>
    </div>
  );
};

export default PDFControlsModal; 