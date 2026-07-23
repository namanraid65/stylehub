import React, { useState } from 'react';
import { UploadCloud, Download, X, CheckCircle, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkProductCsvModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = `name,category,brand,price,compareAtPrice,stock,description,color,size\n"Embroidered Kurta Set","Women","DesiCouture",2999,3999,25,"Pure silk embroidered set","Maroon","M"\n"Slim Fit Linen Shirt","Men","StyleHub Basics",1499,1999,50,"100% Organic Linen","White","L"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stylehub_product_import_template.csv';
    a.click();
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative border border-gray-100 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif">Bulk CSV Product Import</h2>
          <p className="text-xs text-gray-500 mt-1">Upload multiple multi-variant products in one click</p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium underline"
        >
          <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
        </button>

        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-rose-300 transition cursor-pointer bg-gray-50">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
            <FileText className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">
              {file ? file.name : 'Click or Drag CSV file here'}
            </p>
          </label>
        </div>

        {uploadSuccess ? (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> 12 Products imported successfully!
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Parsing CSV & Creating Products...
              </>
            ) : (
              'Start Bulk Import'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
