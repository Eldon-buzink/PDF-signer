'use client';

import { useState } from 'react';
import PDFUploader from '@/Components/PDFUploader';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (file) {
      alert(`PDF ${file.name} is ready for signing!`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-[#0F172A] mb-8 text-center">
          Upload Your PDF to Sign
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PDFUploader onFileSelect={handleFileSelect} />
          
          {file && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Selected: {file.name}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#4F46E5] text-white py-3 rounded-xl font-medium 
                      hover:bg-[#4338CA] transition-colors disabled:opacity-50 
                      disabled:hover:bg-[#4F46E5]"
            disabled={!file}
          >
            Proceed to Sign
          </button>
        </form>
      </div>
    </div>
  );
}
