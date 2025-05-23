import React, { useState, useCallback, useRef } from 'react';

interface Signature {
  id: string;
  data: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
}

interface SignatureElementProps {
  signature: Signature;
  onUpdate: (updatedSignature: Signature) => void;
  onDelete: (id: string) => void;
  cssWidth?: number;
  cssHeight?: number;
}

const SignatureElement: React.FC<SignatureElementProps> = ({
  signature,
  onUpdate,
  onDelete,
  cssWidth,
  cssHeight,
}) => {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);

  // Mouse move handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    draggingRef.current = true;
    dragOffset.current = {
      x: e.clientX - signature.position.x,
      y: e.clientY - signature.position.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (draggingRef.current) {
      console.log('SignatureElement: handleMouseMove', e.clientX, e.clientY);
      onUpdate({
        ...signature,
        position: {
          x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, (cssWidth ?? 9999) - signature.size.width)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, (cssHeight ?? 9999) - signature.size.height)),
        },
      });
    }
  };
  const handleMouseUp = () => {
    setDragging(false);
    draggingRef.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  // Mouse move handlers for resizing (bottom-right corner)
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
    resizingRef.current = true;
    dragOffset.current = {
      x: e.clientX - (signature.position.x + signature.size.width),
      y: e.clientY - (signature.position.y + signature.size.height),
    };
    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (resizingRef.current) {
      console.log('SignatureElement: handleResizeMouseMove', e.clientX, e.clientY);
      const newWidth = Math.max(20, Math.min(e.clientX - signature.position.x - dragOffset.current.x, (cssWidth ?? 9999) - signature.position.x));
      const newHeight = Math.max(20, Math.min(e.clientY - signature.position.y - dragOffset.current.y, (cssHeight ?? 9999) - signature.position.y));
      onUpdate({
        ...signature,
        size: {
          width: newWidth,
          height: newHeight,
        },
      });
    }
  };
  const handleResizeMouseUp = () => {
    setResizing(false);
    resizingRef.current = false;
    window.removeEventListener('mousemove', handleResizeMouseMove);
    window.removeEventListener('mouseup', handleResizeMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: signature.position.x,
        top: signature.position.y,
        width: signature.size.width,
        height: signature.size.height,
        zIndex: 1000,
        cursor: dragging ? 'grabbing' : 'move',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => { console.log('SignatureElement: onMouseDown', e); handleMouseDown(e); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          outline: 'none',
        }}
      >
        <img
          src={signature.data}
          alt="Signature"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        {/* Resize handle (bottom-right corner) */}
        <div
          onMouseDown={(e) => { console.log('SignatureElement: resize handle onMouseDown', e); handleResizeMouseDown(e); }}
          style={{
            position: 'absolute',
            right: -8,
            bottom: -8,
            width: 16,
            height: 16,
            background: '#fff',
            border: '2px solid #6366f1',
            borderRadius: 9999,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            cursor: 'nwse-resize',
            zIndex: 10,
            display: hovered ? 'block' : 'none',
          }}
        />
        {/* Delete button only on hover */}
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); console.log('SignatureElement: onDelete', signature.id); onDelete(signature.id); }}
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-base shadow-lg hover:bg-red-600 transition-colors"
            title="Delete signature"
            style={{ zIndex: 20 }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default SignatureElement; 