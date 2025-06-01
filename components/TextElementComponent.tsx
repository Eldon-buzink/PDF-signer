import React, { useState, useRef } from 'react';
import type { TextElement } from '../types';

interface TextElementComponentProps {
  textElement: TextElement;
  onUpdate: (updated: TextElement) => void;
  onDelete: (id: string) => void;
}

const TextElementComponent: React.FC<TextElementComponentProps> = ({ textElement, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(textElement.text === '');
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);

  const handleDoubleClick = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Move handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editing) return;
    setDragging(true);
    draggingRef.current = true;
    dragOffset.current = {
      x: e.clientX - textElement.position.x,
      y: e.clientY - textElement.position.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (draggingRef.current) {
      onUpdate({
        ...textElement,
        position: {
          x: Math.max(0, e.clientX - dragOffset.current.x),
          y: Math.max(0, e.clientY - dragOffset.current.y),
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

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
    resizingRef.current = true;
    dragOffset.current = {
      x: e.clientX - (textElement.position.x + textElement.size.width),
      y: e.clientY - (textElement.position.y + textElement.size.height),
    };
    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (resizingRef.current) {
      const newWidth = Math.max(40, e.clientX - textElement.position.x - dragOffset.current.x);
      const newHeight = Math.max(24, e.clientY - textElement.position.y - dragOffset.current.y);
      onUpdate({
        ...textElement,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...textElement, text: e.target.value });
  };

  const handleBlur = () => {
    setEditing(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: textElement.position.x,
        top: textElement.position.y,
        width: textElement.size.width,
        height: textElement.size.height,
        zIndex: 1100,
        background: 'rgba(255,255,255,0.8)',
        border: '1px solid #bbb',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: editing ? 'text' : dragging ? 'grabbing' : 'move',
        overflow: 'visible',
        userSelect: editing ? 'text' : 'none',
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={textElement.text}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            width: '100%',
            height: '100%',
            font: textElement.font || '16px Arial',
            color: textElement.color || '#222',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 4,
          }}
        />
      ) : (
        <span style={{
          width: '100%',
          height: '100%',
          font: textElement.font || '16px Arial',
          color: textElement.color || '#222',
          whiteSpace: 'pre',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: 4,
        }}>{textElement.text || ' '}</span>
      )}
      {/* Resize handle (bottom-right corner) */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          right: -14,
          bottom: -14,
          width: 16,
          height: 16,
          background: '#fff',
          border: '2px solid #6366f1',
          borderRadius: 9999,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          cursor: 'nwse-resize',
          zIndex: 20,
          display: editing ? 'none' : 'block',
        }}
      />
      {/* Delete button on hover */}
      <button
        onClick={() => onDelete(textElement.id)}
        style={{
          position: 'absolute',
          top: -22,
          right: -22,
          width: 28,
          height: 28,
          background: '#f87171',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          display: editing ? 'none' : 'block',
          zIndex: 30,
        }}
        title="Delete text"
      >
        ×
      </button>
    </div>
  );
};

export default TextElementComponent; 