import React, { useState, useCallback } from 'react';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { UploadIcon } from './icons';

interface ProductUploadStepProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

const ProductUploadStep: React.FC<ProductUploadStepProps> = ({ onUpload, isLoading, error }) => {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFile = (files: FileList | null) => {
        if (files && files[0]) {
            setPreview(URL.createObjectURL(files[0]));
            onUpload(files[0]);
        }
    };
    
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
          setDragActive(true);
        } else if (e.type === 'dragleave') {
          setDragActive(false);
        }
      }, []);
    
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="text-center flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-2">Krok 3: Vložte inspiraci - váš nový produkt</h2>
            <p className="text-gray-400 mb-6">Tento kus nábytku bude hvězdou. AI přizpůsobí okolí, aby s ním dokonale ladilo.</p>

            <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} className="w-full max-w-lg">
                <input ref={inputRef} type="file" id="input-file-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleChange} disabled={isLoading} />
                <label
                    id="label-file-upload"
                    htmlFor="input-file-upload"
                    className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-colors ${dragActive ? "border-purple-400" : "border-gray-500"}`}
                >
                    {preview ? (
                        <img src={preview} alt="Náhled produktu" className="object-contain h-full w-full p-2" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                                <span className="font-semibold">Klikněte pro nahrání</span> nebo přetáhněte soubor
                            </p>
                            <p className="text-xs text-gray-500">PNG nebo JPG</p>
                        </div>
                    )}
                    {dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                </label>
            </form>
            
            {isLoading && (
              <div className="mt-6 flex flex-col items-center">
                <Spinner />
                <p className="text-purple-300 mt-2">Zpracovávám váš požadavek...</p>
              </div>
            )}

            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
    );
};

export default ProductUploadStep;