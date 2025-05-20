'use client';

import { useState } from 'react';
import PDFUploader from '@/components/PDFUploader';
import PDFViewer from '@/components/PDFViewer';
import PDFControlsModal from '@/components/PDFControlsModal';

interface Signature {
  id: string;
  data: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (file) {
      setShowPDFViewer(true);
    }
  };

  // PDF Controls Handlers
  const handlePreviousPage = () => {
    if (currentPage > 1 && !isRendering) {
      setCurrentPage(prev => prev - 1);
    }
  };
  const handleNextPage = () => {
    if (currentPage < numPages && !isRendering) {
      setCurrentPage(prev => prev + 1);
    }
  };
  const handleZoomIn = () => {
    if (!isRendering) {
      setScale(prev => Math.min(prev + 0.2, 3.0));
    }
  };
  const handleZoomOut = () => {
    if (!isRendering) {
      setScale(prev => Math.max(prev - 0.2, 0.5));
    }
  };
  const handleCancel = () => {
    setShowPDFViewer(false);
    setFile(null);
    setCurrentPage(1);
    setNumPages(0);
    setScale(1.0);
    setIsRendering(false);
  };
  const handleAddText = () => {
    // Placeholder for add text functionality
  };
  const handleAddSignature = () => {
    setIsDrawingMode(true);
  };
  const handleCloseModal = () => {
    setShowPDFViewer(false);
  };

  const handleDrawingComplete = (signature: Signature) => {
    setSignatures((prev) => [...prev, signature]);
    setIsDrawingMode(false);
  };

  const handleDrawingCancel = () => {
    setIsDrawingMode(false);
  };

  const handleSignatureUpdate = (updatedSignature: Signature) => {
    setSignatures((prev) =>
      prev.map((sig) => (sig.id === updatedSignature.id ? updatedSignature : sig))
    );
  };

  const handleSignatureDelete = (id: string) => {
    setSignatures((prev) => prev.filter((sig) => sig.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
      {!showPDFViewer && (
        <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-lg mb-8">
          <h1 className="text-2xl font-semibold text-[#0F172A] mb-8 text-center">
            Upload Your PDF to Sign
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <PDFUploader onFileSelect={handleFileSelect} />
            {file && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Selected: {file.name}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-[#4F46E5] text-white py-3 rounded-xl font-medium 
                        hover:bg-[#4338CA] transition-colors disabled:opacity-50 
                        disabled:hover:bg-[#4F46E5]"
              disabled={!file}
            >
              Proceed to Sign
            </button>
          </form>
        </div>
      )}

      {showPDFViewer && file && (
        <>
          {/* Main content area: PDF preview and button modal as a group */}
          <div className="w-full flex flex-col items-center justify-center min-h-[80vh]">
            <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8">
              {/* PDF preview group: name modal above preview */}
              <div className="flex flex-col items-center w-full md:w-[600px] max-w-full">
                {/* PDF name modal above preview, not inside preview */}
                <div className="mb-2">
                  <div className="mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-row items-center px-4 py-2 max-w-md w-auto">
                    <span className="max-w-[220px] truncate text-gray-700 text-sm font-medium">
                      {file.name}
                    </span>
                    <button
                      onClick={handleCloseModal}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 rounded-full focus:outline-none flex-shrink-0"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="pdf-preview-container w-full max-w-[600px] overflow-x-hidden">
                  <PDFViewer
                    file={file}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    numPages={numPages}
                    setNumPages={setNumPages}
                    scale={scale}
                    setIsRendering={setIsRendering}
                    isDrawingMode={isDrawingMode}
                    onDrawingComplete={handleDrawingComplete}
                    onDrawingCancel={handleDrawingCancel}
                    signatures={signatures}
                    onSignatureUpdate={handleSignatureUpdate}
                    onSignatureDelete={handleSignatureDelete}
                  />
                  <style>{`
                    .pdf-preview-container canvas {
                      width: 100% !important;
                      max-width: 100% !important;
                      height: auto !important;
                      display: block;
                      margin: 0 auto;
                    }
                  `}</style>
                </div>
              </div>
              {/* Button modal to the right of PDF preview, centered */}
              <div className="flex flex-col items-center self-center w-full md:w-[320px] mt-6 md:mt-0">
                <PDFControlsModal
                  currentPage={currentPage}
                  numPages={numPages}
                  scale={scale}
                  isRendering={isRendering}
                  onPrevious={handlePreviousPage}
                  onNext={handleNextPage}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onCancel={handleCancel}
                  onAddText={handleAddText}
                  onAddSignature={handleAddSignature}
                  onClose={handleCloseModal}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
