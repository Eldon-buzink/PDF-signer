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
}

interface SignatureCanvasProps {
  isDrawing: boolean;
  onDrawingComplete: (signature: Signature) => void;
  onCancel: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRect: { left: number; top: number; width: number; height: number } | null;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  isDrawing,
  onDrawingComplete,
  onCancel,
  containerRef,
  canvasRect,
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
      const signatureData = signaturePadRef.current.toDataURL();
      const newSignature: Signature = {
        id: Date.now().toString(),
        data: signatureData,
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 }, // Default size
      };
      onDrawingComplete(newSignature);
      handleClear();
      setIsDrawingMode(false);
      setShowToolbar(false);
    }
  };

  const handlePadEnd = () => {
    console.log('SignaturePad: onEnd fired (drawing event)');
  };

  if (!isDrawingMode || !canvasRect) return null;

  return (
    <div
      className="absolute"
      style={{
        left: canvasRect.left,
        top: canvasRect.top,
        width: canvasRect.width,
        height: canvasRect.height,
        zIndex: 1000,
        border: '2px solid blue', // Debug border
      }}
    >
      {/* Drawing Canvas */}
      <div className="absolute inset-0 pointer-events-auto">
        <SignaturePad
          ref={signaturePadRef}
          onEnd={handlePadEnd}
          canvasProps={{
            className: 'signature-canvas',
            style: {
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
            },
          }}
        />
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex space-x-2 pointer-events-auto">
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
            title="Clear"
          >
            Clear
          </button>
          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
            title="Undo"
          >
            Undo
          </button>
          <button
            onClick={handleComplete}
            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-medium"
            title="Done"
          >
            Done
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
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