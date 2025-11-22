import React, { useRef, useEffect, useState } from 'react';
import { FurnitureItem } from '../types';

interface SelectFurnitureStepProps {
  imageUrl: string;
  furniture: FurnitureItem[];
  onSelect: (id: string) => void;
}

const SelectFurnitureStep: React.FC<SelectFurnitureStepProps> = ({ imageUrl, furniture, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image resolution
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Calculate dynamic scale factor for high-res images
    // Base it on a standard width of 1000px. If image is 4000px, scale is 4.
    const scaleFactor = Math.max(1, canvas.width / 1000);
    
    const lineWidth = 4 * scaleFactor;
    const fontSize = 24 * scaleFactor;
    const padding = 20 * scaleFactor;

    furniture.forEach(item => {
      const isHovered = item.id === hoveredId;
      const { x, y, width, height } = item.bbox;

      const rectX = x * canvas.width / 100;
      const rectY = y * canvas.height / 100;
      const rectWidth = width * canvas.width / 100;
      const rectHeight = height * canvas.height / 100;

      // Box Styles
      ctx.strokeStyle = isHovered ? '#05f2f2' : '#a855f7'; // Cyan on hover, Purple default
      ctx.lineWidth = isHovered ? (lineWidth * 1.5) : lineWidth;
      ctx.setLineDash(isHovered ? [] : [10 * scaleFactor, 5 * scaleFactor]);
      
      // Draw Stroke
      ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
      
      // Draw Fill (Semi-transparent)
      ctx.fillStyle = isHovered ? 'rgba(5, 242, 242, 0.3)' : 'rgba(168, 85, 247, 0.1)';
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

      // Label Styles
      const label = item.type;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const labelHeight = fontSize * 1.4; // Approximation for background height
      
      // Label Background
      ctx.fillStyle = isHovered ? '#05f2f2' : '#a855f7';
      // Draw label above box, or inside if near top edge
      const labelY = rectY - labelHeight > 0 ? rectY - labelHeight : rectY;
      
      ctx.fillRect(rectX, labelY, textWidth + padding, labelHeight);
      
      // Label Text
      ctx.fillStyle = '#111827'; // Dark text
      ctx.textBaseline = 'top';
      ctx.fillText(label, rectX + (padding / 2), labelY + (scaleFactor * 2));
    });
  };

  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      draw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Redraw when hover changes or furniture list updates
  useEffect(() => {
    if (imageRef.current) {
        draw();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredId, furniture]);

  const findFurnitureAtPos = (posX: number, posY: number): FurnitureItem | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    for (const item of [...furniture].reverse()) { // Check topmost items first
      const { x, y, width, height } = item.bbox;
      const itemRect = {
        x: x * canvas.width / 100,
        y: y * canvas.height / 100,
        width: width * canvas.width / 100,
        height: height * canvas.height / 100,
      };
      if (posX >= itemRect.x && posX <= itemRect.x + itemRect.width &&
          posY >= itemRect.y && posY <= itemRect.y + itemRect.height) {
        return item;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const item = findFurnitureAtPos(x, y);
    setHoveredId(item ? item.id : null);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const item = findFurnitureAtPos(x, y);
    if (item) {
      onSelect(item.id);
    }
  };

  return (
    <div className="text-center flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-2">Krok 2: Vyberte ústřední bod proměny</h2>
      <p className="text-gray-400 mb-6">Klikněte na předmět, který bude nahrazen a stane se inspirací pro nový design.</p>
      
      {furniture.length === 0 ? (
        <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 p-4 rounded-lg mb-4">
          AI nenašla v této místnosti žádný zřejmý nábytek. Zkuste jinou fotku nebo nahrajte fotku, kde je nábytek lépe vidět.
        </div>
      ) : null}

      <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-600">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredId(null)}
          className="w-full h-auto"
          style={{ cursor: hoveredId ? 'pointer' : 'default' }}
        />
      </div>
    </div>
  );
};

export default SelectFurnitureStep;