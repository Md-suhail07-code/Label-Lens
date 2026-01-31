// src/components/TestOCR.jsx
import React, { useState } from 'react';
import axios from 'axios';

const TestOCR = () => {
  // 1. State Management
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2. Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Reset previous states
      setExtractedText('');
      setError('');
      
      // Set file state
      setSelectedFile(file);
      
      // Create a local preview URL for UI feedback
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 3. Handle Upload & API Call
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Create FormData object to send file data
    const formData = new FormData();
    // 'image' must match the key expected by multer in the backend route
    formData.append('image', selectedFile);

    try {
      // Replace with your actual backend URL
      // Note: Ensure your backend CORS is configured to allow requests from localhost:5173 (Vite default)
      const response = await axios.post('https://label-lens-backend.onrender.com/api/ocr/extract-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setExtractedText(response.data.text);
      } else {
        setError(response.data.message || 'Failed to extract text.');
      }

    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.response?.data?.error || 'Server error during extraction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          OCR Test Scanner
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          
          {/* File Input styled as a box */}
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="text-sm text-gray-500">Click to upload product image</p>
              </div>
              <input id="dropzone-file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-4">
               <p className="text-sm text-gray-600 mb-2">Preview:</p>
               <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ${
              (isLoading || !selectedFile) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
               <span className="flex items-center">
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Extracting Text...
               </span>
            ) : (
              'Extract Text'
            )}
          </button>
        </form>

        {/* Results Area */}
        {extractedText && (
          <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Extracted Results:</h3>
            {/* pre-wrap ensures newline characters from the OCR are respected */}
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-3 rounded border max-h-60 overflow-y-auto">
              {extractedText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestOCR;