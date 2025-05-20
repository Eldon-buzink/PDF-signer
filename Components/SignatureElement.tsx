import React, { useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface Signature {
  id: string;
  data: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface SignatureElementProps {
  signature: Signature;
  onUpdate: (updatedSignature: Signature) => void;
  onDelete: (id: string) => void;
}

const SignatureElement: React.FC<SignatureElementProps> = ({
  signature,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

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

  return (
    <Draggable
      position={signature.position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={isResizing}
    >
      <div className="absolute">
        <Resizable
          width={signature.size.width}
          height={signature.size.height}
          onResizeStart={handleResizeStart}
          onResizeStop={handleResizeStop}
          minConstraints={[100, 50]}
          maxConstraints={[300, 150]}
        >
          <div
            style={{
              width: signature.size.width,
              height: signature.size.height,
              position: 'relative',
            }}
          >
            <img
              src={signature.data}
              alt="Signature"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            <button
              onClick={() => onDelete(signature.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              title="Delete signature"
            >
              ×
            </button>
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
};

export default SignatureElement; 