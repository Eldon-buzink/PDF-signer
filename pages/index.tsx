'use client';

import { useState, useRef } from 'react';
import PDFUploader from '@/components/PDFUploader';
import PDFViewer from '@/components/PDFViewer';
import PDFControlsModal from '@/components/PDFControlsModal';
import type { Signature, TextElement } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const addSignatureCallbackRef = useRef<(() => void) | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setScale(1.0);
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
      setScale(prev => Math.min(prev + 0.1, 3.0));
    }
  };
  const handleZoomOut = () => {
    if (!isRendering) {
      setScale(prev => Math.max(prev - 0.1, 0.5));
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
  const handleDownload = async () => {
    if (!file) return;
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Embed font for text elements
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw signatures
    signatures.forEach(sig => {
      const page = pdfDoc.getPage(sig.page - 1);
      const imgWidth = sig.size.width;
      const imgHeight = sig.size.height;
      // Add signature image
      if (sig.data.startsWith('data:image/png')) {
        pdfDoc.embedPng(sig.data).then(img => {
          page.drawImage(img, {
            x: sig.position.x,
            y: page.getHeight() - sig.position.y - imgHeight,
            width: imgWidth,
            height: imgHeight,
          });
        });
      } else if (sig.data.startsWith('data:image/jpeg')) {
        pdfDoc.embedJpg(sig.data).then(img => {
          page.drawImage(img, {
            x: sig.position.x,
            y: page.getHeight() - sig.position.y - imgHeight,
            width: imgWidth,
            height: imgHeight,
          });
        });
      }
    });

    // Draw text elements
    textElements.forEach(el => {
      const page = pdfDoc.getPage(el.page - 1);
      const fontSize = el.font ? parseInt(el.font) || 16 : 16;
      page.drawText(el.text, {
        x: el.position.x + 2,
        y: page.getHeight() - el.position.y - fontSize - 2,
        size: fontSize,
        font,
        color: rgb(0.13, 0.13, 0.13),
        maxWidth: el.size.width - 4,
      });
    });

    // Wait for all signature images to be embedded
    await Promise.all([]); // No-op, but keeps async structure

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signed.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setShowPDFViewer(false);
    setShowThankYou(true);
  };
  const handleAddText = () => {
    setIsDrawingMode(false);
    setIsTextMode(true);
  };
  const handleAddSignature = () => {
    setIsTextMode(false);
    setIsDrawingMode(true);
  };
  const handleCloseModal = () => {
    setShowPDFViewer(false);
  };

  const handleDrawingComplete = (signature: Omit<Signature, 'page'>, page: number) => {
    setSignatures((prev) => [...prev, { ...signature, page }]);
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

  // Text element handlers
  const handleAddTextElement = (textElement: Omit<TextElement, 'id'>) => {
    setTextElements((prev) => [
      ...prev,
      { ...textElement, id: Date.now().toString() },
    ]);
  };
  const handleUpdateTextElement = (updated: TextElement) => {
    setTextElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
  };
  const handleDeleteTextElement = (id: string) => {
    setTextElements((prev) => prev.filter((el) => el.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
      {showThankYou && (
        <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-lg mb-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center w-full">
            <img src="/pdf-mascot.png" alt="PDF Mascot" className="mx-auto mb-3" style={{ maxWidth: 300, width: '100%', height: 'auto' }} />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] mb-4 text-center">Thank you for signing!</h1>
          <p className="text-gray-700 text-center mb-6">Your signed PDF has been downloaded.<br/>If you need to sign another document, you can upload a new PDF below.</p>
          <button
            className="bg-[#4F46E5] text-white py-3 px-8 rounded-xl font-medium hover:bg-[#4338CA] transition-colors"
            onClick={() => { setShowThankYou(false); setFile(null); setSignatures([]); setTextElements([]); setCurrentPage(1); setNumPages(0); setScale(1.0); }}
          >
            Upload Another PDF
          </button>
        </div>
      )}
      {!showPDFViewer && !showThankYou && (
        <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-lg mb-8">
          <div className="flex flex-col items-center w-full justify-center">
            <img src="/pdf-mascot.png" alt="PDF Mascot" className="mx-auto mb-3 block" style={{ maxWidth: 300, width: '100%', height: 'auto' }} />
          </div>
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
              className="w-full bg-gradient-to-r from-[#7b3ff2] to-[#3f8efc] text-white py-3 rounded-xl font-bold font-sans transition-colors disabled:opacity-50 disabled:hover:bg-[#7b3ff2] shadow-lg"
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
            <div className="flex flex-col md:flex-row items-center justify-center w-full gap-4 md:gap-8">
              {/* PDF preview group: name modal above preview */}
              <div className="flex flex-col items-center w-full max-w-[600px] md:max-w-[800px] lg:max-w-[900px]">
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
                <div className="pdf-preview-container w-full max-w-[600px] md:max-w-[800px] lg:max-w-[900px] overflow-x-auto">
                  <PDFViewer
                    file={file}
                    numPages={numPages}
                    setNumPages={setNumPages}
                    scale={scale}
                    setIsRendering={setIsRendering}
                    isDrawingMode={isDrawingMode}
                    isTextMode={isTextMode}
                    currentPage={currentPage}
                    onDrawingComplete={handleDrawingComplete}
                    onDrawingCancel={handleDrawingCancel}
                    signatures={signatures}
                    onSignatureUpdate={handleSignatureUpdate}
                    onSignatureDelete={handleSignatureDelete}
                    textElements={textElements}
                    onAddTextElement={handleAddTextElement}
                    onUpdateTextElement={handleUpdateTextElement}
                    onDeleteTextElement={handleDeleteTextElement}
                    setIsTextMode={setIsTextMode}
                  />
                </div>
              </div>
              {/* Button modal to the right of PDF preview, centered */}
              <div className="flex flex-col items-center self-center w-full md:w-[320px] mt-4 md:mt-0 sticky bottom-4 md:relative z-50">
                <PDFControlsModal
                  currentPage={currentPage}
                  numPages={numPages}
                  scale={scale}
                  isRendering={isRendering}
                  onPrevious={handlePreviousPage}
                  onNext={handleNextPage}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onDownload={handleDownload}
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
