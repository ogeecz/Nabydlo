
export enum AppStep {
  UPLOAD_ROOM = 'upload_room',
  SELECT_FURNITURE = 'select_furniture',
  UPLOAD_PRODUCT = 'upload_product',
  PROCESSING = 'processing',
  RESULT = 'result',
}

export enum ProcessStage {
    ANALYZING = 'Analýza geometrie',
    // REMOVING removed - optimized into Compositing
    COMPOSITING = 'Výměna nábytku a fotorealistická integrace',
    FINALIZING = 'Finalizace detailů'
}

export interface BoundingBox {
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage width
  height: number; // percentage height
}

export interface ProductPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FurnitureItem {
  id: string;
  type: string;
  bbox: BoundingBox;
}

export interface AppState {
  step: AppStep;
  roomPhoto: File | null;
  roomPhotoUrl: string | null;
  productPhoto: File | null;
  productPhotoUrl: string | null;
  detectedFurniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  processStage: ProcessStage | null;
  resultImageUrl: string | null;
  error: string | null;
  isLoading: boolean;
  emptyRoomImageUrl: string | null;
  emptyRoomBase64: string | null;
}