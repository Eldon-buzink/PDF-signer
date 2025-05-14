import { useState } from "react";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pdfFile) {
      alert(`PDF ${pdfFile.name} is ready for signing!`);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center p-4">
        <h1 className="text-2xl font-bold mb-4">Upload Your PDF to Sign</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full p-2 border border-gray-300 rounded"
          />
          {pdfFile && (
            <div className="mt-4 text-sm text-gray-700">
              <p>Selected file: {pdfFile.name}</p>
            </div>
          )}
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Proceed to Sign
          </button>
        </form>
      </div>
    </main>
  );
}
