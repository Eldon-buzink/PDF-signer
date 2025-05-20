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
    
    const PDFViewer = ({ file, currentPage, setCurrentPage, numPages, setNumPages, scale, setIsRendering }: PDFViewerProps) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

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
      }, [scale, setIsRendering]);

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
      }, [file, renderPage, setCurrentPage, setNumPages]);

      // Render page when page number or scale changes
      useEffect(() => {
        if (!pdfDoc) return;
        renderPage(pdfDoc, currentPage);
      }, [currentPage, pdfDoc, renderPage]);

      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative overflow-auto bg-gray-100 rounded-lg">
            {(isLoading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
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
            <div ref={containerRef} className="min-h-full flex items-center justify-center p-4" />
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
  currentPage: number;
  setCurrentPage: (page: number) => void;
  numPages: number;
  setNumPages: (num: number) => void;
  scale: number;
  setIsRendering: (isRendering: boolean) => void;
}

export default function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerComponent {...props} />;
} 