import React, { useState, useCallback } from 'react';
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

interface SignatureElementProps {
  signature: Signature;
  onUpdate: (updatedSignature: Signature) => void;
  onDelete: (id: string) => void;
}

const handleStyles = {
  topLeft: { left: -8, top: -8, cursor: 'nwse-resize' },
  topRight: { right: -8, top: -8, cursor: 'nesw-resize' },
  bottomLeft: { left: -8, bottom: -8, cursor: 'nesw-resize' },
  bottomRight: { right: -8, bottom: -8, cursor: 'nwse-resize' },
};

const SignatureElement: React.FC<SignatureElementProps> = ({
  signature,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDragStop = useCallback(
    (e: any, data: { x: number; y: number }) => {
      setIsDragging(false);
      onUpdate({
        ...signature,
        position: { x: data.x, y: data.y },
      });
    },
    [signature, onUpdate]
  );

  const handleResizeStop = useCallback(
    (e: any, { size }: { size: { width: number; height: number } }) => {
      setIsResizing(false);
      onUpdate({
        ...signature,
        size,
      });
    },
    [signature, onUpdate]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  // Custom handle for each corner
  const renderHandle = (position: keyof typeof handleStyles) => (
    <div
      key={position}
      style={{
        position: 'absolute',
        width: 16,
        height: 16,
        background: '#fff',
        border: '2px solid #6366f1',
        borderRadius: 9999,
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        ...handleStyles[position],
        zIndex: 10,
        display: hovered || isResizing ? 'block' : 'none',
      }}
      className="resize-handle"
    />
  );

  return (
    <Draggable
      position={signature.position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
    >
      <div
        className="absolute group"
        style={{ cursor: isDragging ? 'grabbing' : hovered ? 'move' : 'default', zIndex: isDragging ? 20 : 10 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Resizable
          width={signature.size.width}
          height={signature.size.height}
          onResizeStart={handleResizeStart}
          onResizeStop={handleResizeStop}
          minConstraints={[10, 10]}
          maxConstraints={[600, 300]}
          handle={
            <>
              {renderHandle('topLeft')}
              {renderHandle('topRight')}
              {renderHandle('bottomLeft')}
              {renderHandle('bottomRight')}
            </>
          }
          handleSize={[16, 16]}
        >
          <div
            style={{
              width: signature.size.width,
              height: signature.size.height,
              position: 'relative',
              boxShadow: (isDragging || isResizing) ? '0 4px 16px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.10)',
              outline: (isDragging || isResizing || hovered) ? '2px dashed #6366f1' : 'none',
              outlineOffset: 2,
              transition: 'box-shadow 0.2s, outline 0.2s',
              background: 'transparent',
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
            {/* Delete button only on hover */}
            {hovered && (
              <button
                onClick={() => onDelete(signature.id)}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-base shadow-lg hover:bg-red-600 transition-colors"
                title="Delete signature"
                style={{ zIndex: 20 }}
              >
                ×
              </button>
            )}
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
};

export default SignatureElement; 