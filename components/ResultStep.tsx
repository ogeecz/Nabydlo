import React, { useState } from 'react';
import Button from './common/Button';
import { RestartIcon, ZoomInIcon, DownloadIcon } from './icons';

interface ResultStepProps {
  originalUrl: string;
  resultUrl: string;
  onRestart: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({ originalUrl, resultUrl, onRestart }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // This JS approach prevents navigation if the user middle-clicks and gives more control.
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = 'novy-pokoj.png'; // Suggested filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      <div className="text-center flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Váš nový designový prostor je hotov!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full mb-8">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Před</h3>
            <img src={originalUrl} alt="Původní místnost" className="rounded-lg shadow-lg w-full h-auto object-contain border-2 border-gray-700" />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Po</h3>
            <div 
              className="relative group w-full cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            >
              <img src={resultUrl} alt="Místnost s novým nábytkem" className="rounded-lg shadow-lg w-full h-auto object-contain border-2 border-purple-500" />
              <div
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                  aria-label="Zvětšit obrázek"
              >
                  <ZoomInIcon className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4">
            <Button onClick={onRestart} className="flex items-center space-x-2">
                <RestartIcon className="w-5 h-5" />
                <span>Začít znovu</span>
            </Button>
            <a 
              href={resultUrl} 
              download="novy-pokoj.png" 
              onClick={handleDownload} 
              className="inline-flex items-center space-x-2 px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 bg-gray-600 text-gray-200 hover:bg-gray-500 focus:ring-gray-400"
            >
                <DownloadIcon className="w-5 h-5" />
                <span>Stáhnout obrázek</span>
            </a>
        </div>
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={resultUrl}
            alt="Zvětšený náhled"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking the image
          />
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 text-white text-5xl font-light hover:text-gray-300 transition-colors leading-none"
            aria-label="Zavřít náhled"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};

export default ResultStep;