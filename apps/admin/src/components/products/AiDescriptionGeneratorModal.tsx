import React, { useState } from 'react';
import { Sparkles, X, Check, Copy } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (desc: string) => void;
  productTitle?: string;
  category?: string;
}

export default function AiDescriptionGeneratorModal({ isOpen, onClose, onApply, productTitle = '', category = '' }: Props) {
  const [title, setTitle] = useState(productTitle || 'Silk Embroidered Anarkali Set');
  const [fabric, setFabric] = useState('Pure Chanderi Silk');
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const generated = `Elevate your festive wardrobe with our exquisite ${title}. Crafted from premium ${fabric}, this stunning ensemble features intricate artisan embroidery, detailed neckline patterns, and a gracefully flowing silhouette. Perfect for grand celebrations, weddings, and evening galas. Comes with a matching dupatta and tailored bottoms for effortless elegance.\n\nKey Highlights:\n• Premium ${fabric} fabric with luxurious sheen\n• Intricate handcrafted embroidery & zari work\n• Breathable inner lining for all-day comfort\n• Dry clean only to maintain fabric brilliance`;
      setGeneratedDesc(generated);
      setGenerating(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-rose-600">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900 font-serif">AI Fashion Writer</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Fabric & Style Keywords</label>
            <input
              type="text"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Drafting High-Converting Description...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate AI Description
              </>
            )}
          </button>

          {generatedDesc && (
            <div className="space-y-2 pt-2">
              <label className="block font-medium text-gray-700">Generated Preview:</label>
              <textarea
                rows={6}
                value={generatedDesc}
                onChange={(e) => setGeneratedDesc(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none font-sans"
              />
              <button
                onClick={() => {
                  onApply(generatedDesc);
                  onClose();
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <Check className="w-4 h-4" /> Insert into Product Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
