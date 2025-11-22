import React, { useState, useRef, useEffect } from 'react';
import { ProductPlacement } from '../types';
import Button from './common/Button';

interface AdjustPlacementStepProps {
  emptyRoomUrl: string;
  productUrl: string;
  onConfirm: (placement: ProductPlacement) => void;
}

type InteractionMode = 'move' | 'resize-br' | 'none'; // bottom-right resize

const AdjustPlacementStep: React.FC<AdjustPlacementStepProps> = ({ emptyRoomUrl, productUrl, onConfirm }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 200, height: 150 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Center the product initially
      const initialWidth = container.clientWidth * 0.4; // Start at 40% width
      const initialHeight = initialWidth * 0.75; 
      setSize({ width: initialWidth, height: initialHeight });
      setPosition({
        x: (container.clientWidth - initialWidth) / 2,
        y: (container.clientHeight - initialHeight) / 2,
      });
    }
  }, []);
  
  const handleMouseDown = (e: React.MouseEvent, mode: InteractionMode) => {
    e.preventDefault();
    e.stopPropagation();
    setInteractionMode(mode);
    setStartDragPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (interactionMode === 'none') return;
    
    const dx = e.clientX - startDragPos.x;
    const dy = e.clientY - startDragPos.y;
    
    if (interactionMode === 'move') {
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (interactionMode === 'resize-br') {
      setSize(prev => ({ width: prev.width + dx, height: prev.height + dy }));
    }
    
    setStartDragPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setInteractionMode('none');
  };

  const handleConfirm = () => {
    const container = containerRef.current;
    if (!container) return;

    // Convert pixel values to percentages
    const placement: ProductPlacement = {
      x: (position.x / container.clientWidth) * 100,
      y: (position.y / container.clientHeight) * 100,
      width: (size.width / container.clientWidth) * 100,
      height: (size.height / container.clientHeight) * 100,
    };
    onConfirm(placement);
  };

  return (
    <div className="text-center flex flex-col items-center w-full">
      <h2 className="text-2xl font-semibold mb-2">Krok 4: Upravte umístění a velikost</h2>
      <p className="text-gray-400 mb-6">Přesuňte a změňte velikost nábytku tak, aby dokonale zapadl. Poté potvrďte.</p>
      
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-600 aspect-[4/3]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={emptyRoomUrl} alt="Prázdná místnost" className="absolute inset-0 w-full h-full object-cover" />
        
        <div
          className="absolute border-2 border-dashed border-cyan-400 cursor-move"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          <img src={productUrl} alt="Nový produkt" className="w-full h-full object-contain" />
          
          {/* Resize handle */}
          <div
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-cyan-400 rounded-full cursor-se-resize border-2 border-gray-800"
            onMouseDown={(e) => handleMouseDown(e, 'resize-br')}
          ></div>
        </div>
      </div>
      
      <Button onClick={handleConfirm} className="mt-6">
        Potvrdit umístění a spustit AI
      </Button>
    </div>
  );
};

export default AdjustPlacementStep;
