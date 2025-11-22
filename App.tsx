import React, { useState, useCallback, useEffect } from 'react';
import { AppState, AppStep, ProcessStage } from './types';
import UploadStep from './components/UploadStep';
import SelectFurnitureStep from './components/SelectFurnitureStep';
import ProductUploadStep from './components/ProductUploadStep';
import ProcessingStep from './components/ProcessingStep';
import ResultStep from './components/ResultStep';
import Button from './components/common/Button';
import { analyzeScene, integrateFurniture } from './services/geminiService';

function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>({
    step: AppStep.UPLOAD_ROOM,
    roomPhoto: null,
    roomPhotoUrl: null,
    productPhoto: null,
    productPhotoUrl: null,
    detectedFurniture: [],
    selectedFurnitureId: null,
    processStage: null,
    resultImageUrl: null,
    error: null,
    isLoading: false,
    emptyRoomImageUrl: null,
    emptyRoomBase64: null,
  });

  // --- API KEY CHECK ---
  useEffect(() => {
    const checkApiKey = async () => {
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
      setAppState(prev => ({ ...prev, error: null }));
    }
  };

  const resetState = () => {
    if (appState.roomPhotoUrl) URL.revokeObjectURL(appState.roomPhotoUrl);
    if (appState.productPhotoUrl) URL.revokeObjectURL(appState.productPhotoUrl);
    if (appState.resultImageUrl) URL.revokeObjectURL(appState.resultImageUrl);
    if (appState.emptyRoomImageUrl) URL.revokeObjectURL(appState.emptyRoomImageUrl);

    setAppState({
      step: AppStep.UPLOAD_ROOM,
      roomPhoto: null,
      roomPhotoUrl: null,
      productPhoto: null,
      productPhotoUrl: null,
      detectedFurniture: [],
      selectedFurnitureId: null,
      processStage: null,
      resultImageUrl: null,
      error: null,
      isLoading: false,
      emptyRoomImageUrl: null,
      emptyRoomBase64: null,
    });
  };

  const handleError = (err: any) => {
      console.error(err);
      let errorMessage = err.message || 'Neznámá chyba.';
      
      if (errorMessage.includes('403') || errorMessage.includes('Permission denied')) {
          errorMessage = 'Přístup odepřen (Chyba 403). Váš API klíč nemá oprávnění pro modely Gemini 3 Pro. Zvolte prosím klíč s aktivním fakturací.';
      } else if (errorMessage.includes('Requested entity was not found')) {
          setHasApiKey(false);
          errorMessage = 'API klíč nebyl nalezen. Prosím vyberte klíč znovu.';
      }

      setAppState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
  };

  const handleRoomUpload = useCallback(async (file: File) => {
    setAppState(prev => ({ ...prev, isLoading: true, error: null, roomPhoto: file, roomPhotoUrl: URL.createObjectURL(file) }));
    try {
      const furniture = await analyzeScene(file);
      setAppState(prev => ({
        ...prev,
        step: AppStep.SELECT_FURNITURE,
        detectedFurniture: furniture,
        isLoading: false,
      }));
    } catch (err) {
      handleError(err);
    }
  }, []);

  const handleFurnitureSelect = useCallback((id: string) => {
    setAppState(prev => ({
      ...prev,
      step: AppStep.UPLOAD_PRODUCT,
      selectedFurnitureId: id,
    }));
  }, []);
  
  // Hlavní AI Pipeline (OPTIMIZED)
  const handleProductUpload = useCallback(async (file: File) => {
    const productUrl = URL.createObjectURL(file);
    
    const { roomPhoto, selectedFurnitureId, detectedFurniture } = appState;
    if (!roomPhoto || !selectedFurnitureId) return;

    const selectedFurniture = detectedFurniture.find(f => f.id === selectedFurnitureId);
    if (!selectedFurniture) return;

    // 1. Start Processing
    setAppState(prev => ({ 
      ...prev, 
      productPhoto: file, 
      productPhotoUrl: productUrl,
      step: AppStep.PROCESSING,
      processStage: ProcessStage.ANALYZING, // Short delay visualization
      isLoading: true, 
      error: null 
    }));

    try {
      // OPTIMIZATION: We skip the separate "Remove" step.
      // We go straight to Integration which now handles replacement in one go.
      
      setAppState(prev => ({ ...prev, processStage: ProcessStage.COMPOSITING }));
      
      const resultImage = await integrateFurniture(
          roomPhoto,
          file, 
          selectedFurniture
      );

      // 3. Finalize
      setAppState(prev => ({...prev, processStage: ProcessStage.FINALIZING}));
      await new Promise(res => setTimeout(res, 800));

      setAppState(prev => ({
        ...prev,
        step: AppStep.RESULT,
        resultImageUrl: resultImage,
        isLoading: false,
      }));

    } catch (err: any) {
      handleError(err);
    }
  }, [appState]);

  // --- RENDER AUTH SCREEN IF NO KEY ---
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
         <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl text-center border border-gray-700">
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Vítejte v AI Výměna Nábytku
            </h1>
            <p className="text-gray-400 mb-8">
              Tato aplikace využívá nejnovější modely <strong>Gemini 3 Pro</strong> pro fotorealistické úpravy. 
              Pro pokračování je nutné vybrat API klíč s podporou těchto modelů.
            </p>
            <Button onClick={handleSelectKey} className="w-full mb-4">
               Vybrat API klíč
            </Button>
            <p className="text-xs text-gray-500">
              Ujistěte se, že váš projekt má povolenou fakturaci. 
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline ml-1">
                Více o fakturaci
              </a>.
            </p>
         </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (appState.step) {
      case AppStep.UPLOAD_ROOM:
        return <UploadStep onUpload={handleRoomUpload} isLoading={appState.isLoading} error={appState.error} />;
      
      case AppStep.SELECT_FURNITURE:
        if (!appState.roomPhotoUrl) return null;
        return <SelectFurnitureStep 
          imageUrl={appState.roomPhotoUrl} 
          furniture={appState.detectedFurniture} 
          onSelect={handleFurnitureSelect} 
        />;
      
      case AppStep.UPLOAD_PRODUCT:
        return <ProductUploadStep onUpload={handleProductUpload} isLoading={appState.isLoading} error={appState.error} />;
      
      case AppStep.PROCESSING:
        return <ProcessingStep stage={appState.processStage} />;
      
      case AppStep.RESULT:
        if (!appState.roomPhotoUrl || !appState.resultImageUrl) {
            return <div className="text-center">
                <h2 className="text-2xl font-semibold text-red-400">Chyba zobrazení výsledku</h2>
                <p className="text-gray-400 mt-4">{appState.error || "Nebylo možné vygenerovat obrázek."}</p>
                <button onClick={resetState} className="mt-6 px-6 py-2 bg-purple-600 rounded-lg">Začít znovu</button>
            </div>
        }
        return <ResultStep originalUrl={appState.roomPhotoUrl} resultUrl={appState.resultImageUrl} onRestart={resetState} />;
      
      default:
        return <UploadStep onUpload={handleRoomUpload} isLoading={appState.isLoading} error={appState.error} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="text-left">
            <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            AI Výměna Nábytku
            </h1>
            <p className="text-gray-400 text-sm mt-1">Powered by Gemini 3 Pro</p>
        </div>
        
        {/* Key Management Button */}
        <button 
            onClick={handleSelectKey}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1 rounded border border-gray-700 transition-colors"
            title="Změnit API klíč"
        >
            API Key
        </button>
      </header>

      <main className="w-full max-w-5xl flex-grow flex flex-col items-center justify-center">
        <div className="w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700">
            {/* Global Error Display for Permissions */}
            {appState.error && (appState.error.includes('403') || appState.error.includes('Permission denied')) && (
               <div className="mb-6 bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg flex flex-col items-center">
                   <p className="mb-3 font-semibold">{appState.error}</p>
                   <Button onClick={handleSelectKey} variant="secondary" className="text-sm py-2">
                       Změnit / Vybrat API klíč
                   </Button>
               </div>
            )}
            
            {renderStep()}
        </div>
      </main>
    </div>
  );
}

export default App;