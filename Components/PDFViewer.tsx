'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { PDFDocumentProxy, PDFPageProxy } from '@/utils/pdfjs-config';
import type { TextElement } from '../types';
import SignatureCanvas from './SignatureCanvas';
import SignatureElement from './SignatureElement';
import React from 'react';
import TextElementComponent from './TextElementComponent';

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
    
    const PDFViewer = ({ file, numPages, setNumPages, scale, setIsRendering, isDrawingMode, isTextMode, onDrawingComplete, onDrawingCancel, signatures, onSignatureUpdate, onSignatureDelete, textElements, onAddTextElement, onUpdateTextElement, onDeleteTextElement, setIsTextMode, onRequestAddSignature }: any) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
      const [canvasRects, setCanvasRects] = useState<{left: number, top: number, width: number, height: number}[]>([]);
      const [drawingPage, setDrawingPage] = useState<number | null>(null);

      // Detect most visible page in viewport
      const getMostVisiblePage = () => {
        if (!containerRef.current) return 1;
        const pageDivs = Array.from(containerRef.current.querySelectorAll('canvas'));
        let maxVisible = 0;
        let mostVisiblePage = 1;
        
        // Get viewport height
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + vh;
        
        console.log('Viewport:', { top: viewportTop, bottom: viewportBottom, height: vh });
        
        pageDivs.forEach((canvas, idx) => {
          const rect = canvas.getBoundingClientRect();
          const pageTop = rect.top + window.scrollY;
          const pageBottom = pageTop + rect.height;
          
          // Calculate how much of the page is visible
          const visibleTop = Math.max(viewportTop, pageTop);
          const visibleBottom = Math.min(viewportBottom, pageBottom);
          const visible = Math.max(0, visibleBottom - visibleTop);
          
          console.log(`Page ${idx + 1} visibility:`, {
            pageTop,
            pageBottom,
            visibleTop,
            visibleBottom,
            visible,
            rect
          });
          
          if (visible > maxVisible) {
            maxVisible = visible;
            mostVisiblePage = idx + 1;
          }
        });
        
        console.log('Most visible page:', mostVisiblePage, 'with visibility:', maxVisible);
        return mostVisiblePage;
      };

      // Expose a method to parent to trigger drawing mode for a specific page
      useEffect(() => {
        if (onRequestAddSignature) {
          onRequestAddSignature(() => {
            const page = getMostVisiblePage();
            console.log('Setting drawing page to:', page);
            setDrawingPage(page);
          });
        }
      }, [onRequestAddSignature]);

      // Add scroll event listener to update drawing page
      useEffect(() => {
        const handleScroll = () => {
          if (isDrawingMode) {
            const page = getMostVisiblePage();
            console.log('Scroll detected, most visible page:', page);
            setDrawingPage(page);
          }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }, [isDrawingMode]);

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
          } catch (error) {
            if (!mounted) return;
            setError(error instanceof Error ? error.message : 'Failed to load PDF');
          } finally {
            if (mounted) setIsLoading(false);
          }
        };
        loadPDF();
        return () => { mounted = false; };
      }, [file, setNumPages]);

      // Render all pages
      useEffect(() => {
        if (!pdfDoc || !containerRef.current) return;
        setIsRendering(true);
        const renderAllPages = async () => {
          const rects: {left: number, top: number, width: number, height: number}[] = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            if (!containerRef.current) return;
            const page = await pdfDoc.getPage(i);
            const canvas = containerRef.current.querySelector(`#pdf-canvas-${i}`) as HTMLCanvasElement;
            if (canvas) {
              const viewport = page.getViewport({ scale });
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              // Log PDF page dimensions and viewport
              console.log(`Page ${i} dimensions:`, {
                originalWidth: page.view[2] - page.view[0],
                originalHeight: page.view[3] - page.view[1],
                viewportWidth: viewport.width,
                viewportHeight: viewport.height,
                scale: scale
              });

              const context = canvas.getContext('2d', { alpha: false });
              if (context) {
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: context, viewport, background: 'rgba(255,255,255,1)' }).promise;
              }
              
              // Get the parent container's rect
              const parentContainer = canvas.parentElement;
              if (!parentContainer) continue;
              
              const parentRect = parentContainer.getBoundingClientRect();
              const canvasRect = canvas.getBoundingClientRect();
              
              // Calculate rect relative to parent container
              rects.push({
                left: canvasRect.left - parentRect.left,
                top: canvasRect.top - parentRect.top,
                width: canvasRect.width,
                height: canvasRect.height,
              });
              
              // Log measurements for debugging
              console.log(`Page ${i} measurements:`, {
                parentRect,
                canvasRect,
                relativeRect: rects[i - 1],
                viewport: viewport
              });
            }
          }
          setCanvasRects(rects);
          setIsRendering(false);
        };
        renderAllPages();
      }, [pdfDoc, scale, setIsRendering]);

      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative overflow-auto bg-gray-100 rounded-lg">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                <div className="text-red-600 p-4 text-center">
                  <p className="font-semibold">Error loading PDF</p>
                  <p className="text-sm mt-2">{error}</p>
                </div>
              </div>
            )}
            <div ref={containerRef} className="min-h-full flex flex-col items-center justify-start p-4 gap-8 relative overflow-y-auto max-h-[80vh]">
              {/* Render all PDF pages as canvases */}
              {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => {
                const pageNum = i + 1;
                console.log(`Rendering page ${pageNum}, signatures:`, signatures);
                const pageSignatures = signatures.filter((sig: Signature) => sig.page === pageNum);
                console.log(`Page ${pageNum} filtered signatures:`, pageSignatures);
                
                return (
                  <div key={i} className="relative w-full flex justify-center mb-8 last:mb-0">
                    <div className="relative" style={{ width: '100%', maxWidth: '600px' }}>
                      {/* Shared relative container for canvas and signatures */}
                      <div
                        className="relative"
                        style={{
                          width: canvasRects[i]?.width || '100%',
                          height: canvasRects[i]?.height || 'auto',
                        }}
                      >
                        <canvas
                          id={`pdf-canvas-${pageNum}`}
                          className="w-full h-auto border border-gray-200 shadow-lg bg-white rounded-lg"
                          style={{ border: '2px solid red' }}
                        />
                        {/* Signature Canvas Layer for this page */}
                        {drawingPage === pageNum && canvasRects[i] && (
                          <div
                            className="absolute top-0 left-0"
                            style={{
                              width: canvasRects[i]?.width || '100%',
                              height: canvasRects[i]?.height || 'auto',
                              pointerEvents: isDrawingMode ? 'auto' : 'none',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              border: '2px solid blue',
                            }}
                          >
                            <SignatureCanvas
                              isDrawing={isDrawingMode}
                              onDrawingComplete={(sig) => {
                                onDrawingComplete(sig, pageNum);
                                setDrawingPage(null);
                              }}
                              onCancel={() => {
                                onDrawingCancel();
                                setDrawingPage(null);
                              }}
                              containerRef={containerRef}
                              canvasRect={canvasRects[i]}
                              page={pageNum}
                              cssWidth={canvasRects[i]?.width}
                              cssHeight={canvasRects[i]?.height}
                            />
                          </div>
                        )}
                        {/* Placed Signatures for this page */}
                        {pageSignatures.map((signature: Signature) => (
                          <SignatureElement
                            key={signature.id}
                            signature={signature}
                            onUpdate={onSignatureUpdate}
                            onDelete={onSignatureDelete}
                            cssWidth={canvasRects[i]?.width}
                            cssHeight={canvasRects[i]?.height}
                          />
                        ))}
                        {/* Page text elements for this page */}
                        {textElements.filter((textElement: TextElement) => textElement.page === pageNum).map((textElement: TextElement) => (
                          <TextElementComponent
                            key={textElement.id}
                            textElement={textElement}
                            onUpdate={onUpdateTextElement}
                            onDelete={onDeleteTextElement}
                          />
                        ))}
                      </div>
                      {/* Page number overlay */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white bg-opacity-80 px-3 py-1 rounded-lg shadow text-sm font-semibold text-gray-700 border border-gray-200 select-none pointer-events-none">
                        Page {pageNum} of {pdfDoc.numPages}
                      </div>
                      {isTextMode && (
                        <div
                          className="absolute inset-0 z-50"
                          style={{ cursor: 'text', background: 'rgba(255,0,0,0.1)' }}
                          onClick={e => {
                            console.log('PDFViewer: overlay clicked');
                            // Only handle left click
                            if (e.button !== 0) return;
                            // Get click position relative to the container
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            // Add a new text element at this position (default size 120x32)
                            onAddTextElement({
                              text: '',
                              position: { x, y },
                              size: { width: 120, height: 32 },
                              page: pageNum,
                              font: '16px Arial',
                              color: '#222',
                            });
                            setIsTextMode(false);
                            e.stopPropagation();
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
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

interface Signature {
  id: string;
  data: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
}

interface PDFViewerProps {
  file: File;
  numPages: number;
  setNumPages: (num: number) => void;
  scale: number;
  setIsRendering: (isRendering: boolean) => void;
  isDrawingMode: boolean;
  isTextMode: boolean;
  onDrawingComplete: (signature: Omit<Signature, 'page'>, page: number) => void;
  onDrawingCancel: () => void;
  signatures: Signature[];
  onSignatureUpdate: (signature: Signature) => void;
  onSignatureDelete: (id: string) => void;
  textElements: TextElement[];
  onAddTextElement: (textElement: Omit<TextElement, 'id'>) => void;
  onUpdateTextElement: (textElement: TextElement) => void;
  onDeleteTextElement: (id: string) => void;
  setIsTextMode: (val: boolean) => void;
  onRequestAddSignature: (callback: () => void) => void;
}

export default function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerComponent {...props} />;
} 