import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

function initializePdfJs() {
  if (typeof window !== 'undefined') {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use local worker file
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
    }
  }

  return pdfjsLib;
}

export { initializePdfJs };
export type { PDFDocumentProxy, PDFPageProxy }; 