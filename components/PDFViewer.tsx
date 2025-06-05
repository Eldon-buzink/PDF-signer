'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PDFDocumentProxy, PDFPageProxy } from '@/utils/pdfjs-config';
import type { TextElement } from '../types';
import SignatureCanvas, { SignatureCanvasHandle } from './SignatureCanvas';
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

// Add page cache type
interface PageCache {
  [key: number]: {
    canvas: HTMLCanvasElement;
    viewport: any;
    timestamp: number;
  };
}

// Dynamically import the PDF viewer to prevent SSR issues
const PDFViewerComponent = dynamic(
  async () => {
    const { initializePdfJs } = await import('@/utils/pdfjs-config');
    
    const PDFViewer = ({ file, numPages, setNumPages, scale, setScale, setIsRendering, isDrawingMode, isTextMode, currentPage, onDrawingComplete, onDrawingCancel, signatures, onSignatureUpdate, onSignatureDelete, textElements, onAddTextElement, onUpdateTextElement, onDeleteTextElement, setIsTextMode }: any) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
      const [canvasRects, setCanvasRects] = useState<{left: number, top: number, width: number, height: number}[]>([]);
      const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
      const pageCache = useRef<PageCache>({});
      const observerRef = useRef<IntersectionObserver | null>(null);
      const signaturePadRefs = useRef<(SignatureCanvasHandle | null)[]>([]);
      const [autoScale, setAutoScale] = useState(true);

      // Initialize refs array when numPages changes
      useEffect(() => {
        signaturePadRefs.current = Array(numPages).fill(null);
      }, [numPages]);

      // Setup intersection observer for lazy loading
      useEffect(() => {
        if (!containerRef.current) return;

        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const pageNum = parseInt(entry.target.getAttribute('data-page') || '1');
              if (entry.isIntersecting) {
                setVisiblePages(prev => new Set([...prev, pageNum]));
              } else {
                setVisiblePages(prev => {
                  const next = new Set(prev);
                  next.delete(pageNum);
                  return next;
                });
              }
            });
          },
          {
            root: containerRef.current,
            rootMargin: '100px 0px',
            threshold: 0.1,
          }
        );

        return () => {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        };
      }, []);

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

      // Automatically fit PDF to container width on load or when container size changes
      useEffect(() => {
        if (!pdfDoc || !containerRef.current || !autoScale) return;
        const handleResize = () => {
          if (!containerRef.current) return;
          const containerWidth = containerRef.current.offsetWidth;
          pdfDoc.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1 });
            const fitScale = (containerWidth - 32) / viewport.width; // 32px padding
            setScale(fitScale);
          });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, [pdfDoc, autoScale, setScale]);

      // Render visible pages with caching
      const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc || !containerRef.current) return;

        const canvas = containerRef.current.querySelector(`#pdf-canvas-${pageNum}`) as HTMLCanvasElement;
        if (!canvas) return;

        // Check cache first
        const cached = pageCache.current[pageNum];
        if (cached && cached.viewport.scale === scale) {
          const context = canvas.getContext('2d', { alpha: false });
          if (context) {
            context.drawImage(cached.canvas, 0, 0);
          }
          return;
        }

        try {
          const page = await pdfDoc.getPage(pageNum);
          // Use only scale for viewport, do not pass rotation
          const viewport = page.getViewport({ scale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d', { alpha: false });
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport, background: 'rgba(255,255,255,1)' }).promise;

            // Cache the rendered page
            const cacheCanvas = document.createElement('canvas');
            cacheCanvas.width = canvas.width;
            cacheCanvas.height = canvas.height;
            const cacheContext = cacheCanvas.getContext('2d');
            if (cacheContext) {
              cacheContext.drawImage(canvas, 0, 0);
              pageCache.current[pageNum] = {
                canvas: cacheCanvas,
                viewport,
                timestamp: Date.now(),
              };
            }
          }
        } catch (error) {
          console.error(`Error rendering page ${pageNum}:`, error);
        }
      }, [pdfDoc, scale]);

      // Render visible pages
      useEffect(() => {
        if (!pdfDoc) return;
        setIsRendering(true);

        const renderVisiblePages = async () => {
          const promises = Array.from(visiblePages).map(pageNum => renderPage(pageNum));
          await Promise.all(promises);
          setIsRendering(false);
        };

        renderVisiblePages();
      }, [pdfDoc, visiblePages, renderPage, setIsRendering]);

      // Clean up old cache entries
      useEffect(() => {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        Object.entries(pageCache.current).forEach(([pageNum, cache]) => {
          if (now - cache.timestamp > maxAge) {
            delete pageCache.current[parseInt(pageNum)];
          }
        });
      }, [visiblePages]);

      // Update canvas rects when scale changes
      useEffect(() => {
        if (!containerRef.current) return;
        const rects: {left: number, top: number, width: number, height: number}[] = [];
        Array.from({ length: numPages }, (_, i) => {
          const canvas = containerRef.current?.querySelector(`#pdf-canvas-${i + 1}`) as HTMLCanvasElement;
          if (canvas) {
            const parentContainer = canvas.parentElement;
            if (parentContainer) {
              const parentRect = parentContainer.getBoundingClientRect();
              const canvasRect = canvas.getBoundingClientRect();
              rects.push({
                left: canvasRect.left - parentRect.left,
                top: canvasRect.top - parentRect.top,
                width: canvasRect.width,
                height: canvasRect.height,
              });
            }
          }
        });
        setCanvasRects(rects);
      }, [numPages, scale]);

      // Memoize page rendering to prevent unnecessary re-renders
      const renderPages = useMemo(() => {
        if (!pdfDoc) return [];
        
        return Array.from({ length: pdfDoc.numPages }, (_, i) => {
          const pageNum = i + 1;
          const pageSignatures = signatures.filter((sig: Signature) => sig.page === pageNum);
          const isCurrentPage = pageNum === currentPage;
          
          return (
            <div 
              key={i} 
              data-page={pageNum}
              ref={(el) => {
                if (el && observerRef.current) {
                  observerRef.current.observe(el);
                }
              }}
              className={`relative w-full flex justify-center mb-8 last:mb-0 transition-all duration-300 ${
                isCurrentPage ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              <div
                className="relative overflow-auto w-full max-w-[600px] md:max-w-[800px] lg:max-w-[900px] rounded-lg shadow-lg"
                style={{ width: canvasRects[i]?.width || undefined }}
              >
                <div
                  className="relative bg-white rounded-lg"
                  style={{
                    width: canvasRects[i]?.width || '100%',
                    height: canvasRects[i]?.height || 'auto',
                  }}
                >
                  <canvas
                    id={`pdf-canvas-${pageNum}`}
                    className="border border-gray-200 bg-white rounded-lg"
                  />
                  
                  {/* Signature Canvas Layer */}
                  {isDrawingMode && canvasRects[i] && (
                    <div
                      className="absolute top-0 left-0 touch-none"
                      style={{
                        width: canvasRects[i]?.width || '100%',
                        height: canvasRects[i]?.height || 'auto',
                        pointerEvents: 'auto',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <SignatureCanvas
                        ref={(ref) => {
                          signaturePadRefs.current[i] = ref;
                        }}
                        isDrawing={true}
                        onDrawingComplete={(sig) => {
                          onDrawingComplete(sig, pageNum);
                        }}
                        onCancel={() => {
                          onDrawingCancel();
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

                  {/* Text mode overlay */}
                  {isTextMode && (
                    <div
                      className="absolute inset-0 z-50"
                      style={{ cursor: 'text', background: 'rgba(255,0,0,0.1)' }}
                      onClick={e => {
                        if (e.button !== 0) return;
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
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

                  {/* Page number overlay */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-4 bg-white bg-opacity-90 px-4 py-2 rounded-full shadow-md text-sm font-medium text-gray-700 border border-gray-200 select-none pointer-events-none backdrop-blur-sm">
                    Page {pageNum} of {pdfDoc.numPages}
                  </div>
                </div>
              </div>
            </div>
          );
        });
      }, [pdfDoc, signatures, currentPage, isDrawingMode, isTextMode, canvasRects]);

      // If user zooms manually, turn off autoScale
      const handleZoomIn = () => {
        setScale((prev: number) => Math.min(prev + 0.1, 3.0));
        setAutoScale(false);
      };
      const handleZoomOut = () => {
        setScale((prev: number) => Math.max(prev - 0.1, 0.5));
        setAutoScale(false);
      };

      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative overflow-auto bg-gray-100 rounded-lg">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="text-sm font-medium text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                <div className="text-red-600 p-6 text-center max-w-sm">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-semibold text-lg mb-2">Error loading PDF</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            <div ref={containerRef} className="min-h-full flex flex-col items-center justify-start p-4 gap-8 relative overflow-y-auto max-h-[80vh] scroll-smooth">
              {isDrawingMode && (
                <div
                  className="bg-white rounded-xl shadow-2xl p-1.5 md:p-2 flex space-x-1 md:space-x-3 pointer-events-auto border border-gray-200 z-[1100]"
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    right: 0,
                    minWidth: 180,
                    maxWidth: '98%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <button
                    onClick={() => {
                      // Clear all signature pads
                      signaturePadRefs.current.forEach(ref => ref?.clear());
                    }}
                    className="px-2 py-1 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm md:text-base font-semibold text-gray-700 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                    title="Clear"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      // Undo on all signature pads
                      signaturePadRefs.current.forEach(ref => ref?.undo());
                    }}
                    className="px-2 py-1 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm md:text-base font-semibold text-gray-700 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                    title="Undo"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => {
                      // Complete all signature pads
                      signaturePadRefs.current.forEach((ref, index) => {
                        if (ref) {
                          ref.complete();
                        }
                      });
                    }}
                    className="px-2 py-1 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm md:text-base font-semibold text-white shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title="Done"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      // Cancel all signature pads
                      signaturePadRefs.current.forEach(ref => ref?.cancel());
                    }}
                    className="px-2 py-1 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm md:text-base font-semibold text-gray-700 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {renderPages}
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
  setScale: (scale: number) => void;
  setIsRendering: (isRendering: boolean) => void;
  isDrawingMode: boolean;
  isTextMode: boolean;
  currentPage: number;
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
}

export default function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerComponent {...props} />;
} 