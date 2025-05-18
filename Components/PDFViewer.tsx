'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { PDFDocumentProxy, PDFPageProxy } from '@/utils/pdfjs-config';

// Create a singleton render lock
const renderLock = {
  isLocked: false,
  currentRender: null as any,
  async acquire() {
    if (this.isLocked) {
      if (this.currentRender) {
        try {
          this.currentRender.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    this.isLocked = true;
  },
  release() {
    this.isLocked = false;
    this.currentRender = null;
  }
};

// Dynamically import the PDF viewer to prevent SSR issues
const PDFViewerComponent = dynamic(
  async () => {
    const { initializePdfJs } = await import('@/utils/pdfjs-config');
    
    const PDFViewer = ({ file, onClose }: PDFViewerProps) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
      const [currentPage, setCurrentPage] = useState(1);
      const [numPages, setNumPages] = useState(0);
      const [scale, setScale] = useState(1.0);
      const [isRendering, setIsRendering] = useState(false);

      const renderPage = useCallback(async (pdf: PDFDocumentProxy, pageNumber: number) => {
        if (!containerRef.current) return;

        try {
          await renderLock.acquire();
          setIsRendering(true);

          const canvas = document.createElement('canvas');
          canvas.className = 'border border-gray-200 shadow-lg';
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);

          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          const containerWidth = containerRef.current.clientWidth;
          const containerScale = containerWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale: scale * containerScale });

          canvas.height = scaledViewport.height;
          canvas.width = scaledViewport.width;

          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('Could not get canvas context');

          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);

          const renderTask = page.render({
            canvasContext: context,
            viewport: scaledViewport,
            background: 'rgba(255,255,255,1)'
          });

          renderLock.currentRender = renderTask;
          await renderTask.promise;

        } catch (error) {
          if (error instanceof Error && error.message !== 'Rendering cancelled') {
            console.error('Error rendering page:', error);
            setError(error.message);
          }
        } finally {
          renderLock.release();
          setIsRendering(false);
        }
      }, [scale]);

      // Load PDF document
      useEffect(() => {
        let mounted = true;

        const loadPDF = async () => {
          if (!containerRef.current) return;
          setIsLoading(true);
          setError(null);

          try {
            const pdfjs = await initializePdfJs();
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            if (!mounted) return;

            setNumPages(pdf.numPages);
            setPdfDoc(pdf);
            setCurrentPage(1);
            await renderPage(pdf, 1);
          } catch (error) {
            if (!mounted) return;
            console.error('Error loading PDF:', error);
            setError(error instanceof Error ? error.message : 'Failed to load PDF');
          } finally {
            if (mounted) {
              setIsLoading(false);
            }
          }
        };

        loadPDF();
        return () => {
          mounted = false;
          if (renderLock.currentRender) {
            try {
              renderLock.currentRender.cancel();
            } catch (e) {
              // Ignore cancellation errors
            }
          }
        };
      }, [file, renderPage]);

      // Render page when page number or scale changes
      useEffect(() => {
        if (!pdfDoc) return;
        renderPage(pdfDoc, currentPage);
      }, [currentPage, pdfDoc, renderPage]);

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

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {file.name} (Page {currentPage} of {numPages})
              </h2>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage <= 1 || isRendering}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleZoomOut}
                disabled={isRendering}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Zoom Out
              </button>
              <span className="px-3 py-1">{Math.round(scale * 100)}%</span>
              <button
                onClick={handleZoomIn}
                disabled={isRendering}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Zoom In
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages || isRendering}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="relative overflow-auto flex justify-center">
              {(isLoading || isRendering) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                  <div className="text-red-600 p-4 text-center">
                    <p className="font-semibold">Error loading PDF</p>
                    <p className="text-sm mt-2">{error}</p>
                  </div>
                </div>
              )}
              <div ref={containerRef} className="flex justify-center" />
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isRendering}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Signature
              </button>
            </div>
          </div>
        </div>
      );
    };

    return PDFViewer;
  },
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    ),
  }
);

interface PDFViewerProps {
  file: File;
  onClose: () => void;
}

export default function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerComponent {...props} />;
} 