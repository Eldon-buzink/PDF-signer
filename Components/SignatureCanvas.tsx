import React, { useRef, useState, useEffect } from 'react';
import SignaturePad from 'react-signature-canvas';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface Signature {
  id: string;
  data: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
}

interface SignatureCanvasProps {
  isDrawing: boolean;
  onDrawingComplete: (signature: Omit<Signature, 'page'>, page: number) => void;
  onCancel: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRect: { left: number; top: number; width: number; height: number } | null;
  page: number;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  isDrawing,
  onDrawingComplete,
  onCancel,
  containerRef,
  canvasRect,
  page,
}) => {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    if (isDrawing) {
      setIsDrawingMode(true);
      setShowToolbar(true);
      // Change cursor to pencil
      if (containerRef.current) {
        containerRef.current.style.cursor = 'crosshair';
      }
      if (canvasRect) {
        console.log('Signature overlay rect:', canvasRect);
      }
      // Log SignaturePad ref and canvas
      if (signaturePadRef.current) {
        console.log('SignaturePad ref:', signaturePadRef.current);
        // Try to get the canvas element
        // @ts-ignore
        const padCanvas = signaturePadRef.current._canvas;
        if (padCanvas) {
          console.log('SignaturePad internal canvas:', padCanvas, padCanvas.width, padCanvas.height);
        } else {
          console.log('SignaturePad internal canvas not found');
        }
      } else {
        console.log('SignaturePad ref is null');
      }
    } else {
      setIsDrawingMode(false);
      setShowToolbar(false);
      // Reset cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    }
  }, [isDrawing, containerRef, canvasRect]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleUndo = () => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove last stroke
        signaturePadRef.current.fromData(data);
      }
    }
  };

  const handleComplete = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      // Calculate bounding box of the drawing
      const data = signaturePadRef.current.toData();
      console.log('SignaturePad toData:', data);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      if (Array.isArray(data) && data.length > 0) {
        if (Array.isArray(data[0])) {
          // Array of arrays of points (Point[][])
          const flatPoints = data.flat();
          console.log('First 5 points (flattened):', flatPoints.slice(0, 5));
          flatPoints.forEach((pt: any) => {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
          });
        } else if (typeof data[0].x === 'number' && typeof data[0].y === 'number') {
          // Flat array of points
          console.log('First 5 points:', data.slice(0, 5));
          data.forEach((pt: any) => {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
          });
        } else {
          // Array of strokes with points
          data.forEach((stroke: any, idx: number) => {
            console.log('Stroke', idx, stroke);
            if (stroke && Array.isArray(stroke.points)) {
              stroke.points.forEach((pt: any) => {
                if (pt.x < minX) minX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y > maxY) maxY = pt.y;
              });
            }
          });
        }
      }
      console.log('Bounding box after calculation:', { minX, minY, maxX, maxY });
      
      // Add padding to bounding box
      const padding = 8;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      
      // Ensure the signature stays within the canvas bounds
      const maxWidth = canvasRect?.width ?? 0;
      const maxHeight = canvasRect?.height ?? 0;
      
      // Constrain the signature to the canvas bounds
      maxX = Math.min(maxX + padding, maxWidth);
      maxY = Math.min(maxY + padding, maxHeight);
      
      const width = Math.max(20, Math.min(maxX - minX, maxWidth - minX));
      const height = Math.max(20, Math.min(maxY - minY, maxHeight - minY));

      // Crop the signature image to the bounding box
      // @ts-ignore
      const padCanvas: HTMLCanvasElement = signaturePadRef.current._canvas;
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      const ctx = croppedCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(padCanvas, minX, minY, width, height, 0, 0, width, height);
      }
      const croppedDataUrl = croppedCanvas.toDataURL();
      
      // Calculate position relative to the current page
      const position = {
        x: Math.min(minX, maxWidth - width),
        y: Math.min(minY, maxHeight - height)
      };

      console.log('Creating signature on page:', page);
      console.log('Signature position:', position);
      console.log('Signature size:', { width, height });
      console.log('Canvas bounds:', { maxWidth, maxHeight });

      const newSignature: Omit<Signature, 'page'> = {
        id: Date.now().toString(),
        data: croppedDataUrl,
        position,
        size: { width, height },
      };
      
      onDrawingComplete(newSignature, page);
      handleClear();
      setIsDrawingMode(false);
      setShowToolbar(false);
    }
  };

  const handlePadEnd = () => {
    console.log('SignaturePad: onEnd fired (drawing event)');
  };

  if (!isDrawingMode || !canvasRect) return null;

  console.log('SignatureCanvas: canvasRect', canvasRect);

  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: 0,
        width: canvasRect.width,
        height: canvasRect.height,
        zIndex: 1000,
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* Drawing Canvas */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        style={{
          width: canvasRect.width,
          height: canvasRect.height,
        }}
      >
        <SignaturePad
          ref={signaturePadRef}
          onEnd={handlePadEnd}
          minWidth={1}
          maxWidth={1.5}
          canvasProps={{
            className: 'signature-canvas',
            width: Math.round(canvasRect.width),
            height: Math.round(canvasRect.height),
            style: {
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              backgroundColor: 'transparent',
            },
          }}
        />
      </div>
      {/* Toolbar */}
      {showToolbar && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl p-2 flex space-x-3 pointer-events-auto border border-gray-200">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-base font-semibold text-gray-700 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            title="Clear"
          >
            Clear
          </button>
          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-base font-semibold text-gray-700 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            title="Undo"
          >
            Undo
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-base font-semibold text-white shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Done"
          >
            Done
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-base font-semibold text-gray-700 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            title="Cancel"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas; 