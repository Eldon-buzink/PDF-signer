'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function PDFUploader({ onFileSelect }: PDFUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else {
      alert('Please upload a valid PDF file.');
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }
      `}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-500 font-medium">Drop your PDF here...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-600">Drag and drop your PDF here, or click to browse</p>
          <p className="text-sm text-gray-500">Only PDF files are accepted</p>
        </div>
      )}
    </div>
  );
}
