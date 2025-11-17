/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, removeImageBackground, createProfilePicture, enhanceImageQuality, removeObjectFromImage } from './services/geminiService';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel, { type ManualAdjustments, type ManualAdjustmentTool } from './components/AdjustmentPanel';
import CropPanel, { type ProfileConfig } from './components/CropPanel';
import WatermarkPanel from './components/WatermarkPanel';
import TextPanel from './components/TextPanel';
import DoodlePanel, { type DoodleMode } from './components/DoodlePanel';
import RemovePanel from './components/RemovePanel';
import { UndoIcon, RedoIcon, EyeIcon, RetouchIcon, AdjustIcon, FilterIcon, CropIcon, WatermarkIcon, ResetIcon, TextIcon, UploadIcon, DownloadIcon, PencilIcon, EditIcon, AddIcon, ZoomIcon, CloseIcon, EraserIcon, ArrowLeftIcon, LineIcon, RectangleIcon, TriangleIcon, StarIcon, CheckIcon, WatermarkTextIcon, WatermarkPhotoIcon, ExposureIcon, SunIcon, ContrastIcon, HighlightsIcon, ShadowsIcon, SaturationIcon, WarmthIcon, TintIcon, VignetteIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop' | 'watermark' | 'text' | 'doodle' | 'remove';

export interface WatermarkConfig {
  type: 'text' | 'photo';
  text: string;
  imageFile: File | null;
  imageUrl: string | null; // For previewing the uploaded watermark image
  opacity: number;
  position: string; // 'top-left', 'center', etc.
  color: string;
  size: number; // as a percentage of image width
}

export interface TextElement {
  id: string;
  text: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // percentage of image width
  color: string;
  bold: boolean;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  hasShadow: boolean;
}

export interface DoodleElement {
  id: string;
  type: DoodleMode | 'freehand'; // Allow 'freehand' for removal mask
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

// FIX: Define a type for navigation items to ensure type safety for subTools.
type TopLevelNavItem = {
  id: Tab | string; // Allow string for sub-tool IDs
  name: string;
  icon: React.FC<{ className?: string; }>;
  subTools?: TopLevelNavItem[];
  value?: number | undefined; // For aspect ratios
  displayName?: string; // For aspect ratios
};


const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('adjust');
  
  const [mobileNavPath, setMobileNavPath] = useState<string[]>([]);
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const zoomableContainerRef = useRef<HTMLDivElement>(null);
  const doodleCanvasRef = useRef<HTMLCanvasElement>(null);
  const removalMaskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const initialManualAdjustments: ManualAdjustments = {
    exposure: 0, brightness: 0, contrast: 0, highlights: 0, shadows: 0, saturation: 0, warmth: 0, tint: 0, vignette: 0,
  };
  const [manualAdjustments, setManualAdjustments] = useState<ManualAdjustments>(initialManualAdjustments);
  const [activeManualTool, setActiveManualTool] = useState<ManualAdjustmentTool>('brightness');

  const initialWatermarkConfig: WatermarkConfig = {
    type: 'text', text: 'avma', imageFile: null, imageUrl: null, opacity: 0.7, position: 'bottom-right', color: '#ffffff', size: 4,
  };
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(initialWatermarkConfig);
  
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextElementId, setSelectedTextElementId] = useState<string | null>(null);
  const dragInfo = useRef<{ id: string; offsetX: number; offsetY: number; isDragging: boolean }>({ id: '', offsetX: 0, offsetY: 0, isDragging: false });

  const [doodleElements, setDoodleElements] = useState<DoodleElement[]>([]);
  const [doodleMode, setDoodleMode] = useState<DoodleMode>('freehand');
  const [doodleColor, setDoodleColor] = useState('#EF4444'); // Default to red
  const [doodleSize, setDoodleSize] = useState(5);
  const [drawingShapePreview, setDrawingShapePreview] = useState<DoodleElement | null>(null);

  const [removalMasks, setRemovalMasks] = useState<DoodleElement[]>([]);
  const [removalBrushSize, setRemovalBrushSize] = useState<number>(30);
  
  const initialProfileConfig: ProfileConfig = { shape: 'circle', background: 'blur' };
  const [profileConfig, setProfileConfig] = useState<ProfileConfig>(initialProfileConfig);

  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(false);


  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (currentImage) {
      objectUrl = URL.createObjectURL(currentImage);
      setCurrentImageUrl(objectUrl);
    } else {
      setCurrentImageUrl(null);
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentImage]);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstallBannerVisible(true);
      }
      console.log(`'beforeinstallprompt' event was fired.`);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (watermarkConfig.imageFile) {
      objectUrl = URL.createObjectURL(watermarkConfig.imageFile);
      setWatermarkConfig(prev => ({...prev, imageUrl: objectUrl}));
    } else {
      if (watermarkConfig.imageUrl && !watermarkConfig.imageFile) {
        setWatermarkConfig(prev => ({...prev, imageUrl: null}));
      }
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [watermarkConfig.imageFile]);

  const drawDoodles = useCallback(() => {
    const canvas = doodleCanvasRef.current;
    if (!canvas || !zoomableContainerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = zoomableContainerRef.current.clientWidth;
    canvas.height = zoomableContainerRef.current.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const elementsToDraw = [...doodleElements];
    if (drawingShapePreview) {
        elementsToDraw.push(drawingShapePreview);
    }
    
    elementsToDraw.forEach(element => {
        if (element.points.length === 0) return;
        
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const canvasPoints = element.points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));

        if (canvasPoints.length < 2 && element.type !== 'freehand') return;

        ctx.beginPath();
        switch (element.type) {
            case 'freehand':
                if (canvasPoints.length < 2) return;
                ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                for (let i = 1; i < canvasPoints.length; i++) {
                    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
                }
                break;
            case 'line':
                ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                ctx.lineTo(canvasPoints[1].x, canvasPoints[1].y);
                break;
            case 'rectangle':
                ctx.rect(canvasPoints[0].x, canvasPoints[0].y, canvasPoints[1].x - canvasPoints[0].x, canvasPoints[1].y - canvasPoints[0].y);
                break;
            case 'triangle': {
                const p1 = canvasPoints[0];
                const p2 = canvasPoints[1];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const heightFactor = Math.sqrt(3) / 2;
                const p3x = midX - dy * heightFactor;
                const p3y = midY + dx * heightFactor;
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3x, p3y);
                ctx.closePath();
                break;
            }
            case 'star': {
                const p1 = canvasPoints[0];
                const p2 = canvasPoints[1];
                const centerX = (p1.x + p2.x) / 2;
                const centerY = (p1.y + p2.y) / 2;
                const outerRadius = Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)) / 2;
                const innerRadius = outerRadius / 2;
                let rot = Math.PI / 2 * 3;
                let x = centerX;
                let y = centerY;
                const step = Math.PI / 5;

                ctx.moveTo(centerX, centerY - outerRadius);
                for (let i = 0; i < 5; i++) {
                    x = centerX + Math.cos(rot) * outerRadius;
                    y = centerY + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = centerX + Math.cos(rot) * innerRadius;
                    y = centerY + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.closePath();
                break;
            }
        }
        ctx.stroke();
    });
  }, [doodleElements, drawingShapePreview]);

  const drawRemovalMask = useCallback(() => {
    const canvas = removalMaskCanvasRef.current;
    if (!canvas || !zoomableContainerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = zoomableContainerRef.current.clientWidth;
    canvas.height = zoomableContainerRef.current.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    removalMasks.forEach(element => {
        if (element.points.length < 2) return;
        
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // Semi-transparent red
        ctx.lineWidth = element.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const canvasPoints = element.points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));

        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
            ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.stroke();
    });
  }, [removalMasks]);
  
  const generateCssFilters = (adjustments: ManualAdjustments): string => {
    const filters = [
      `brightness(${100 + adjustments.brightness + adjustments.exposure}%)`,
      `contrast(${100 + adjustments.contrast}%)`,
      `saturate(${100 + adjustments.saturation}%)`,
    ];
    return filters.join(' ');
  };

  // Effect for live CANVAS-ONLY adjustments (Vignette, Highlights, etc.)
  useEffect(() => {
    if (!currentImageUrl || !previewCanvasRef.current || !imgRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imgRef.current;
    if (!ctx) return;

    const updateCanvas = () => {
        const { clientWidth, clientHeight } = image;
        canvas.width = clientWidth;
        canvas.height = clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Highlights & Shadows (Overlay method)
        if (manualAdjustments.highlights !== 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255, 255, 255, ${manualAdjustments.highlights / 100})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (manualAdjustments.shadows !== 0) {
            ctx.globalCompositeOperation = 'darken';
            ctx.fillStyle = `rgba(0, 0, 0, ${-manualAdjustments.shadows / 100})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.globalCompositeOperation = 'source-over';


        // Warmth & Tint (Overlay method)
        if (manualAdjustments.warmth !== 0) {
            ctx.globalCompositeOperation = 'overlay';
            const color = manualAdjustments.warmth > 0 ? `rgba(255, 165, 0, ${manualAdjustments.warmth / 100})` : `rgba(0, 0, 255, ${-manualAdjustments.warmth / 100})`;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
        }
        if (manualAdjustments.tint !== 0) {
            ctx.globalCompositeOperation = 'overlay';
            const color = manualAdjustments.tint > 0 ? `rgba(0, 255, 0, ${manualAdjustments.tint / 150})` : `rgba(255, 0, 255, ${-manualAdjustments.tint / 150})`;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        // Vignette
        if (manualAdjustments.vignette > 0) {
            const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.3, canvas.width / 2, canvas.height / 2, canvas.width * 0.85);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${manualAdjustments.vignette / 100 * 0.8})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    // If image is already loaded, update immediately. Otherwise, wait for onload.
    if (image.complete) {
      updateCanvas();
    } else {
      image.onload = updateCanvas;
    }

  }, [currentImageUrl, manualAdjustments.highlights, manualAdjustments.shadows, manualAdjustments.warmth, manualAdjustments.tint, manualAdjustments.vignette]);

  useEffect(() => {
    if (activeTab === 'doodle') {
        drawDoodles();
    } else if (activeTab === 'remove') {
        drawRemovalMask();
    }

    const handleResize = () => {
        if (activeTab === 'doodle') drawDoodles();
        else if (activeTab === 'remove') drawRemovalMask();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [doodleElements, drawingShapePreview, removalMasks, activeTab, drawDoodles, drawRemovalMask]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCrop(undefined);
    setCompletedCrop(undefined);
    // Reset transient states after a permanent action
    setManualAdjustments(initialManualAdjustments);
    setTextElements([]);
    setDoodleElements([]);
    setRemovalMasks([]);
  }, [history, historyIndex, initialManualAdjustments]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    history.forEach(oldFile => URL.revokeObjectURL(URL.createObjectURL(oldFile)));
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('adjust');
    setMobileNavPath([]);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setTextElements([]);
    setSelectedTextElementId(null);
    setDoodleElements([]);
    setRemovalMasks([]);
    setZoom(1);
    setManualAdjustments(initialManualAdjustments);
    setWatermarkConfig(initialWatermarkConfig);
    setProfileConfig(initialProfileConfig);
  }, [history, initialManualAdjustments, initialWatermarkConfig]);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    const promptEvent = installPrompt as any; // Type casting to access prompt()
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setInstallPrompt(null);
    setIsInstallBannerVisible(false);
  };

  const handleDismissInstallBanner = () => {
    setIsInstallBannerVisible(false);
  };

  const handleGenerate = useCallback(async () => {
    if (!currentImage) return;
    if (!prompt.trim() || !editHotspot) return;

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        setError(err instanceof Error ? `Failed to generate image. ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? `Failed to apply filter. ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? `Failed to apply adjustment. ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyManualAdjustments = useCallback(() => {
    if (!currentImage || !currentImageUrl) return;
    setIsLoading(true);
    setError(null);
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = currentImageUrl;
    image.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = image.naturalWidth;
        offscreenCanvas.height = image.naturalHeight;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) {
            setError('Could not create canvas context.');
            setIsLoading(false);
            return;
        }

        // Apply filters in the same way as the live preview, but on the full-res canvas
        ctx.filter = generateCssFilters(manualAdjustments);
        ctx.drawImage(image, 0, 0);
        ctx.filter = 'none';

        if (manualAdjustments.highlights !== 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255, 255, 255, ${manualAdjustments.highlights / 100})`;
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        }
        if (manualAdjustments.shadows !== 0) {
            ctx.globalCompositeOperation = 'darken';
            ctx.fillStyle = `rgba(0, 0, 0, ${-manualAdjustments.shadows / 100})`;
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        }
        ctx.globalCompositeOperation = 'source-over';

        if (manualAdjustments.warmth !== 0) {
            ctx.globalCompositeOperation = 'overlay';
            const color = manualAdjustments.warmth > 0 ? `rgba(255, 165, 0, ${manualAdjustments.warmth / 100})` : `rgba(0, 0, 255, ${-manualAdjustments.warmth / 100})`;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        }
        if (manualAdjustments.tint !== 0) {
            ctx.globalCompositeOperation = 'overlay';
            const color = manualAdjustments.tint > 0 ? `rgba(0, 255, 0, ${manualAdjustments.tint / 150})` : `rgba(255, 0, 255, ${-manualAdjustments.tint / 150})`;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        }
        ctx.globalCompositeOperation = 'source-over';
        
        if (manualAdjustments.vignette > 0) {
            const gradient = ctx.createRadialGradient(offscreenCanvas.width / 2, offscreenCanvas.height / 2, offscreenCanvas.width * 0.3, offscreenCanvas.width / 2, offscreenCanvas.height / 2, offscreenCanvas.width * 0.85);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${manualAdjustments.vignette / 100 * 0.8})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        }

        const adjustedDataUrl = offscreenCanvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(adjustedDataUrl, `manual-adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    };
    image.onerror = () => {
        setError('Failed to load image for adjustment.');
        setIsLoading(false);
    };
  }, [currentImage, currentImageUrl, manualAdjustments, addImageToHistory]);

  const handleRemoveBackground = useCallback(async () => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const newImageUrl = await removeImageBackground(currentImage);
        const newImageFile = dataURLtoFile(newImageUrl, `bg-removed-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? `Failed to remove background. ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyObjectRemoval = useCallback(async () => {
    if (!currentImage || !currentImageUrl || removalMasks.length === 0) return;
    setIsLoading(true);
    setError(null);

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = currentImageUrl;
    image.onload = async () => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = image.naturalWidth;
        maskCanvas.height = image.naturalHeight;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) {
            setError('Could not create mask canvas.');
            setIsLoading(false);
            return;
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        const scaleFactor = maskCanvas.width / (imgRef.current?.clientWidth || maskCanvas.width);
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        removalMasks.forEach(element => {
            if (element.points.length < 2) return;
            ctx.lineWidth = element.size * scaleFactor;
            const canvasPoints = element.points.map(p => ({ x: p.x * maskCanvas.width, y: p.y * maskCanvas.height }));
            
            ctx.beginPath();
            ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
            for (let i = 1; i < canvasPoints.length; i++) {
                ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
            }
            ctx.stroke();
        });
        
        try {
            const maskDataUrl = maskCanvas.toDataURL('image/png');
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            
            const newImageUrl = await removeObjectFromImage(currentImage, maskFile);
            const newImageFile = dataURLtoFile(newImageUrl, `removed-${Date.now()}.png`);
            addImageToHistory(newImageFile);
        } catch (err) {
            setError(err instanceof Error ? `Failed to remove object. ${err.message}` : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    image.onerror = () => {
        setError('Failed to load image for object removal.');
        setIsLoading(false);
    };
  }, [currentImage, currentImageUrl, removalMasks, addImageToHistory]);

  const handleCreateProfilePic = useCallback(async () => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const newImageUrl = await createProfilePicture(currentImage, profileConfig.shape, profileConfig.background);
        const newImageFile = dataURLtoFile(newImageUrl, `profile-pic-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? `Failed to create profile picture. ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, profileConfig]);

  const handleEnhanceQuality = useCallback(async () => {
    if (!currentImage) return;
    setIsLoading(true);
    setError(null);
    try {
        const newImageUrl = await enhanceImageQuality(currentImage);
        const newImageFile = dataURLtoFile(newImageUrl, `enhanced-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        setError(err instanceof Error ? `Failed to enhance image. ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);
  }, [completedCrop, addImageToHistory]);
  
  const handleAddText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Your Text',
      x: 50, y: 50, size: 5, color: '#FFFFFF', bold: false,
      fontFamily: 'Inter, sans-serif', textAlign: 'center', hasShadow: true,
    };
    setTextElements(prev => [...prev, newText]);
    setSelectedTextElementId(newText.id);
  };
  
  const handleUpdateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };
  
  const handleDeleteTextElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    if (selectedTextElementId === id) setSelectedTextElementId(null);
  };
  
  const handleApplyTextToImage = useCallback(() => {
    if (!currentImage || !currentImageUrl || textElements.length === 0) return;
    setIsLoading(true);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = currentImageUrl;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsLoading(false);
        return;
      }
      ctx.drawImage(image, 0, 0);
      textElements.forEach(el => {
        const fontSize = (el.size / 100) * canvas.width;
        ctx.font = `${el.bold ? 'bold' : 'normal'} ${fontSize}px ${el.fontFamily}`;
        ctx.fillStyle = el.color;
        ctx.textAlign = el.textAlign;
        ctx.textBaseline = 'middle';
        if (el.hasShadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = fontSize / 8;
            ctx.shadowOffsetX = fontSize / 20;
            ctx.shadowOffsetY = fontSize / 20;
        }
        const x = (el.x / 100) * canvas.width;
        const y = (el.y / 100) * canvas.height;
        ctx.fillText(el.text, x, y);
        // Reset shadow for next element
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });
      const dataUrl = canvas.toDataURL('image/png');
      const newImageFile = dataURLtoFile(dataUrl, `text-applied-${Date.now()}.png`);
      addImageToHistory(newImageFile);
      setIsLoading(false);
    };
    image.onerror = () => setIsLoading(false);
  }, [currentImage, currentImageUrl, textElements, addImageToHistory]);

  const handleApplyDoodles = useCallback(() => {
    if (!currentImage || !currentImageUrl || doodleElements.length === 0) return;
    setIsLoading(true);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = currentImageUrl;
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsLoading(false);
            return;
        }
        ctx.drawImage(image, 0, 0);

        const scaleFactor = canvas.width / (imgRef.current?.clientWidth || canvas.width);

        doodleElements.forEach(element => {
            if (element.points.length === 0) return;

            ctx.strokeStyle = element.color;
            ctx.lineWidth = element.size * scaleFactor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const canvasPoints = element.points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
            if (canvasPoints.length < 2 && element.type !== 'freehand') return;

            ctx.beginPath();
            switch (element.type) {
                case 'freehand':
                    if (canvasPoints.length < 2) return;
                    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                    for (let i = 1; i < canvasPoints.length; i++) {
                        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
                    }
                    break;
                case 'line':
                    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                    ctx.lineTo(canvasPoints[1].x, canvasPoints[1].y);
                    break;
                case 'rectangle':
                    ctx.rect(canvasPoints[0].x, canvasPoints[0].y, canvasPoints[1].x - canvasPoints[0].x, canvasPoints[1].y - canvasPoints[0].y);
                    break;
                case 'triangle': {
                    const p1 = canvasPoints[0];
                    const p2 = canvasPoints[1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const heightFactor = Math.sqrt(3) / 2;
                    const p3x = midX - dy * heightFactor;
                    const p3y = midY + dx * heightFactor;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3x, p3y);
                    ctx.closePath();
                    break;
                }
                case 'star': {
                    const p1 = canvasPoints[0];
                    const p2 = canvasPoints[1];
                    const centerX = (p1.x + p2.x) / 2;
                    const centerY = (p1.y + p2.y) / 2;
                    const outerRadius = Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)) / 2;
                    const innerRadius = outerRadius / 2;
                    let rot = Math.PI / 2 * 3;
                    let x = centerX;
                    let y = centerY;
                    const step = Math.PI / 5;

                    ctx.moveTo(centerX, centerY - outerRadius);
                    for (let i = 0; i < 5; i++) {
                        x = centerX + Math.cos(rot) * outerRadius;
                        y = centerY + Math.sin(rot) * outerRadius;
                        ctx.lineTo(x, y);
                        rot += step;

                        x = centerX + Math.cos(rot) * innerRadius;
                        y = centerY + Math.sin(rot) * innerRadius;
                        ctx.lineTo(x, y);
                        rot += step;
                    }
                    ctx.closePath();
                    break;
                }
            }
            ctx.stroke();
        });

        const dataUrl = canvas.toDataURL('image/png');
        const newImageFile = dataURLtoFile(dataUrl, `doodle-applied-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setIsLoading(false);
    };
    image.onerror = () => setIsLoading(false);
  }, [currentImage, currentImageUrl, doodleElements, addImageToHistory]);

  const handleApplyWatermark = useCallback(() => {
    if (!currentImage || !currentImageUrl) return;

    const { type, text, imageUrl, opacity, position, color, size } = watermarkConfig;
    const isTextWatermark = type === 'text' && text.trim();
    const isPhotoWatermark = type === 'photo' && imageUrl;
    if (!isTextWatermark && !isPhotoWatermark) return;

    setIsLoading(true);
    setError(null);

    const mainImage = new Image();
    mainImage.crossOrigin = 'anonymous';
    mainImage.src = currentImageUrl;
    mainImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = mainImage.naturalWidth;
        canvas.height = mainImage.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsLoading(false);
            setError("Could not create canvas context for watermarking.");
            return;
        }
        ctx.drawImage(mainImage, 0, 0);

        const finalizeAndAddToHistory = (finalCanvas: HTMLCanvasElement) => {
            const dataUrl = finalCanvas.toDataURL('image/png');
            const newImageFile = dataURLtoFile(dataUrl, `watermarked-${Date.now()}.png`);
            addImageToHistory(newImageFile);
            setIsLoading(false);
        };
        
        ctx.globalAlpha = opacity;
        const baseMargin = canvas.width * 0.02;

        if (isTextWatermark) {
            const fontSize = (size / 100) * canvas.width;
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = color;
            
            const shadowBlur = fontSize / 8;
            const shadowOffset = fontSize / 20;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = shadowOffset;
            ctx.shadowOffsetY = shadowOffset;
            
            const totalMargin = baseMargin + shadowBlur + shadowOffset;

            let x = 0, y = 0;
            if (position.includes('left')) { ctx.textAlign = 'left'; x = totalMargin; }
            if (position.includes('center')) { ctx.textAlign = 'center'; x = canvas.width / 2; }
            if (position.includes('right')) { ctx.textAlign = 'right'; x = canvas.width - totalMargin; }
            if (position.includes('top')) { ctx.textBaseline = 'top'; y = totalMargin; }
            if (position.includes('middle')) { ctx.textBaseline = 'middle'; y = canvas.height / 2; }
            if (position.includes('bottom')) { ctx.textBaseline = 'bottom'; y = canvas.height - totalMargin; }
            
            ctx.fillText(text, x, y);
            finalizeAndAddToHistory(canvas);
        } else if (isPhotoWatermark) {
            const watermarkImage = new Image();
            watermarkImage.crossOrigin = 'anonymous';
            watermarkImage.src = imageUrl!;
            watermarkImage.onload = () => {
                const watermarkWidth = (size / 100) * canvas.width;
                const watermarkHeight = watermarkImage.height * (watermarkWidth / watermarkImage.width);
                let x = 0, y = 0;
                if (position.includes('left')) x = baseMargin;
                if (position.includes('center')) x = (canvas.width - watermarkWidth) / 2;
                if (position.includes('right')) x = canvas.width - watermarkWidth - baseMargin;
                if (position.includes('top')) y = baseMargin;
                if (position.includes('middle')) y = (canvas.height - watermarkHeight) / 2;
                if (position.includes('bottom')) y = canvas.height - watermarkHeight - baseMargin;
                ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
                finalizeAndAddToHistory(canvas);
            };
            watermarkImage.onerror = () => {
                setIsLoading(false);
                setError("Failed to load watermark image.");
            };
        }
    };
    mainImage.onerror = () => {
        setIsLoading(false);
        setError("Failed to load main image for watermarking.");
    };
  }, [currentImage, currentImageUrl, watermarkConfig, addImageToHistory]);

  const handleUndo = useCallback(() => { if (canUndo) setHistoryIndex(historyIndex - 1); }, [canUndo, historyIndex]);
  const handleRedo = useCallback(() => { if (canRedo) setHistoryIndex(historyIndex + 1); }, [canRedo, historyIndex]);
  const handleReset = useCallback(() => { if (history.length > 0) setHistoryIndex(0); }, [history]);
  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
  }, []);
  
  const handleDownload = useCallback(() => {
      if (!currentImageUrl) return;
      try {
        const link = document.createElement('a');
        link.href = currentImageUrl;
        const downloadName = originalImage ? originalImage.name.replace(/(\.[\w\d_-]+)$/i, '_edited.png') : 'avma-edited.png';
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        setError("Image download failed.");
      }
  }, [currentImageUrl, originalImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) handleImageUpload(files[0]);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== 'retouch' || !imgRef.current) return;
    
    const image = imgRef.current;
    const zoomable = zoomableContainerRef.current!;
    const container = imageContainerRef.current!;
    const rect = zoomable.getBoundingClientRect(); // Use zoomable container for coords
    const containerRect = container.getBoundingClientRect();

    // Position relative to the visible part of the scroll container
    const viewX = e.clientX - containerRect.left;
    const viewY = e.clientY - containerRect.top;

    // Position relative to the top-left of the scroll container's content
    const scrollX = viewX + container.scrollLeft;
    const scrollY = viewY + container.scrollTop;

    // Position relative to the scaled image
    const imageX = scrollX / zoom;
    const imageY = scrollY / zoom;
    
    // Position hotspot for display (relative to visible viewport)
    setDisplayHotspot({ x: viewX, y: viewY });
    
    // Calculate hotspot relative to the original image dimensions
    const scaleX = image.naturalWidth / image.clientWidth;
    const scaleY = image.naturalHeight / image.clientHeight;

    const originalX = Math.round(imageX * scaleX);
    const originalY = Math.round(imageY * scaleY);
    
    setEditHotspot({ x: originalX, y: originalY });
  };
  
  const onTextDragStart = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const containerRect = imageContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate initial mouse offset from the element's top-left corner, considering zoom
    const offsetX = (e.clientX - rect.left) / zoom;
    const offsetY = (e.clientY - rect.top) / zoom;
    
    dragInfo.current = { id, offsetX, offsetY, isDragging: true };
    setSelectedTextElementId(id);
    document.addEventListener('mousemove', onTextDragMove);
    document.addEventListener('mouseup', onTextDragEnd);
  };
  
  const onTextDragMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current.isDragging || !zoomableContainerRef.current) return;
    e.preventDefault();
    const containerRect = zoomableContainerRef.current.getBoundingClientRect();
    const imageContainer = imageContainerRef.current!;

    // Position relative to the visible viewport
    const viewX = e.clientX - containerRect.left;
    const viewY = e.clientY - containerRect.top;

    // Adjust for the element's internal drag offset
    const newLeft = viewX - (dragInfo.current.offsetX * zoom);
    const newTop = viewY - (dragInfo.current.offsetY * zoom);

    const xPercent = (newLeft / containerRect.width) * 100;
    const yPercent = (newTop / containerRect.height) * 100;

    setTextElements(prev => prev.map(el => el.id === dragInfo.current.id ? { ...el, x: xPercent, y: yPercent } : el));
  }, [zoom]);

  const onTextDragEnd = useCallback(() => {
    dragInfo.current.isDragging = false;
    document.removeEventListener('mousemove', onTextDragMove);
    document.removeEventListener('mouseup', onTextDragEnd);
  }, [onTextDragMove]);

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const container = imageContainerRef.current!;
    const zoomable = zoomableContainerRef.current!;
    const containerRect = container.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Position relative to the scrollable container, including scroll offset
    const xInContainer = clientX - containerRect.left + container.scrollLeft;
    const yInContainer = clientY - containerRect.top + container.scrollTop;

    // Position relative to the scaled content
    const xInContent = xInContainer / zoom;
    const yInContent = yInContainer / zoom;
    
    // Convert to percentage of content dimensions
    const xPercent = xInContent / zoomable.clientWidth;
    const yPercent = yInContent / zoomable.clientHeight;

    return { x: xPercent, y: yPercent };
  };

  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLoading || (activeTab !== 'doodle' && activeTab !== 'remove')) return;
    isDrawing.current = true;
    const pos = getPointerPosition(e);

    if (activeTab === 'doodle') {
      const newElement: DoodleElement = {
        id: `doodle-${Date.now()}`, type: doodleMode, points: [pos], color: doodleColor, size: doodleSize,
      };
      if (doodleMode === 'freehand') {
        setDoodleElements(prev => [...prev, newElement]);
      } else {
        newElement.points.push(pos);
        setDrawingShapePreview(newElement);
      }
    } else if (activeTab === 'remove') {
      const newMask: DoodleElement = {
        id: `mask-${Date.now()}`, type: 'freehand', points: [pos], color: '#EF4444', size: removalBrushSize,
      };
      setRemovalMasks(prev => [...prev, newMask]);
    }
  };

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || isLoading || (activeTab !== 'doodle' && activeTab !== 'remove')) return;
    const pos = getPointerPosition(e);
    if (activeTab === 'doodle') {
      if (doodleMode === 'freehand') {
        setDoodleElements(prev => {
          const last = prev[prev.length - 1];
          if (!last) return prev;
          const newPoints = [...last.points, pos];
          return [...prev.slice(0, -1), { ...last, points: newPoints }];
        });
      } else if (drawingShapePreview) {
        setDrawingShapePreview(prev => prev ? { ...prev, points: [prev.points[0], pos] } : null);
      }
    } else if (activeTab === 'remove') {
      setRemovalMasks(prev => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const newPoints = [...last.points, pos];
        return [...prev.slice(0, -1), { ...last, points: newPoints }];
      });
    }
  };

  const handleDrawEnd = () => {
    if (isDrawing.current && activeTab === 'doodle' && doodleMode !== 'freehand' && drawingShapePreview) {
      setDoodleElements(prev => [...prev, drawingShapePreview]);
      setDrawingShapePreview(null);
    }
    isDrawing.current = false;
  };

  const handleResetCrop = () => { setCrop(undefined); setCompletedCrop(undefined); };
  const handleResetManualAdjustments = () => { setManualAdjustments(initialManualAdjustments); setActiveManualTool('brightness'); };
  const handleResetWatermark = () => setWatermarkConfig(initialWatermarkConfig);
  const handleResetText = () => { setTextElements([]); setSelectedTextElementId(null); };
  const handleResetDoodles = () => { setDoodleElements([]); setDrawingShapePreview(null); };
  const handleResetMasks = () => { setRemovalMasks([]); };


  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-50 border border-red-200 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-800">An Error Occurred</h2>
            <p className="text-md text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors">Try Again</button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen 
        onFileSelect={handleFileSelect}
        isInstallable={isInstallBannerVisible}
        onInstallClick={handleInstallApp}
        onDismissInstall={handleDismissInstallBanner}
      />;
    }
    
    const getWatermarkPreviewStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = { position: 'absolute', padding: '2%', display: 'flex', pointerEvents: 'none', inset: 0 };
        const positionMap: Record<string, React.CSSProperties> = {
            'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' }, 'top-center': { justifyContent: 'center', alignItems: 'flex-start' }, 'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
            'middle-left': { justifyContent: 'flex-start', alignItems: 'center' }, 'middle-center': { justifyContent: 'center', alignItems: 'center' }, 'middle-right': { justifyContent: 'flex-end', alignItems: 'center' },
            'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end' }, 'bottom-center': { justifyContent: 'center', alignItems: 'flex-end' }, 'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end' },
        };
        return { ...base, ...(positionMap[watermarkConfig.position] || {}) };
    };

    const imageDisplay = (
      <>
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={isComparing && originalImage ? URL.createObjectURL(originalImage) : currentImageUrl}
            alt={isComparing ? "Original" : "Current version"}
            className="max-h-full max-w-full object-contain transition-opacity duration-300 shadow-lg"
            style={{
                filter: isComparing ? 'none' : generateCssFilters(manualAdjustments),
                opacity: activeTab === 'crop' ? 0 : 1, // Hide if crop is active to prevent overlap
            }}
        />
        <canvas
            ref={previewCanvasRef}
            className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300 ${isComparing ? 'opacity-0' : 'opacity-100'}`}
        />
      </>
    );

    const isManuallyAdjusted = Object.values(manualAdjustments).some(val => val !== 0);
    const hasWatermarkConfig = (watermarkConfig.type === 'text' && watermarkConfig.text.trim() !== '') || (watermarkConfig.type === 'photo' && watermarkConfig.imageFile);
    
    const manualAdjustmentTools: TopLevelNavItem[] = [
        { id: 'exposure', name: 'Exposure', icon: ExposureIcon },
        { id: 'brightness', name: 'Brightness', icon: SunIcon },
        { id: 'contrast', name: 'Contrast', icon: ContrastIcon },
        { id: 'highlights', name: 'Highlights', icon: HighlightsIcon },
        { id: 'shadows', name: 'Shadows', icon: ShadowsIcon },
        { id: 'saturation', name: 'Saturation', icon: SaturationIcon },
        { id: 'warmth', name: 'Warmth', icon: WarmthIcon },
        { id: 'tint', name: 'Tint', icon: TintIcon },
        { id: 'vignette', name: 'Vignette', icon: VignetteIcon },
    ];
    
    const cropAspects: TopLevelNavItem[] = [
        { id: 'free', name: 'Free', displayName: 'Free', value: undefined, icon: CropIcon }, { id: '1:1', name: 'Square', displayName: 'Square', value: 1 / 1, icon: CropIcon },
        { id: '4:5', name: 'Portrait', displayName: 'Portrait', value: 4 / 5, icon: CropIcon }, { id: '9:16', name: 'Story', displayName: 'Story', value: 9 / 16, icon: CropIcon },
        { id: '16:9', name: 'Wide', displayName: 'Wide', value: 16 / 9, icon: CropIcon },
    ];
    const profilePictureTools: TopLevelNavItem[] = [
        { id: 'profile', name: 'Profile Pic', icon: RetouchIcon }
    ];
    const profileShapes: TopLevelNavItem[] = [{ id: 'circle', name: 'Circle', icon: RetouchIcon }, { id: 'square', name: 'Square', icon: RetouchIcon }];
    const profileBackgrounds: TopLevelNavItem[] = [{ id: 'blur', name: 'Blur', icon: RetouchIcon }, { id: 'studio', name: 'Studio', icon: RetouchIcon }, { id: 'gradient', name: 'Gradient', icon: RetouchIcon }];


    const navConfig: {
        retouch: TopLevelNavItem[];
        edit: TopLevelNavItem[];
        add: TopLevelNavItem[];
    } = {
        retouch: [{ id: 'retouch', name: 'Retouch', icon: RetouchIcon }],
        edit: [
            { id: 'adjust', name: 'Adjust', icon: AdjustIcon, subTools: manualAdjustmentTools },
            { id: 'filters', name: 'Filters', icon: FilterIcon },
            { id: 'crop', name: 'Crop', icon: CropIcon, subTools: [...cropAspects, ...profilePictureTools] },
            { id: 'remove', name: 'Remove', icon: EraserIcon },
        ],
        add: [
            { id: 'text', name: 'Text', icon: TextIcon },
            { id: 'doodle', name: 'Doodle', icon: PencilIcon, subTools: [
                { id: 'freehand', name: 'Draw', icon: PencilIcon },
                { id: 'line', name: 'Line', icon: LineIcon },
                { id: 'rectangle', name: 'Rectangle', icon: RectangleIcon },
                { id: 'triangle', name: 'Triangle', icon: TriangleIcon },
                { id: 'star', name: 'Star', icon: StarIcon },
            ]},
            { id: 'watermark', name: 'Watermark', icon: WatermarkIcon, subTools: [
                { id: 'text', name: 'Text', icon: WatermarkTextIcon },
                { id: 'photo', name: 'Photo', icon: WatermarkPhotoIcon },
            ]},
        ]
    };
    
    const allNavItems = [...navConfig.retouch, ...navConfig.edit, ...navConfig.add];

    const renderPanel = (tab: Tab) => {
        switch (tab) {
            case 'retouch': return (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-md text-slate-500 text-center">{editHotspot ? 'Great! Now describe your localized edit below.' : 'Click an area on the image to make a precise edit.'}</p>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col md:flex-row items-center gap-2">
                        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editHotspot ? "e.g., 'change my shirt color to blue'" : "First click a point on the image"} className="flex-grow bg-white border border-slate-300 text-slate-800 rounded-lg p-4 text-base focus:ring-2 focus:ring-primary-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-400" disabled={isLoading || !editHotspot} />
                        <button type="submit" className="hidden md:block w-full md:w-auto bg-gradient-to-br from-primary-600 to-primary-500 text-white font-bold py-4 px-8 text-base rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-400 disabled:to-blue-300 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none" disabled={isLoading || !prompt.trim() || !editHotspot}>Generate</button>
                    </form>
                </div>
            );
            case 'adjust': return <AdjustmentPanel onApplyAjustment={handleApplyAdjustment} onRemoveBackground={handleRemoveBackground} manualAdjustments={manualAdjustments} onManualAdjustmentChange={setManualAdjustments} isLoading={isLoading} activeManualTool={activeManualTool} onActiveManualToolChange={setActiveManualTool}/>;
            case 'filters': return <FilterPanel onApplyFilter={handleApplyFilter} onEnhanceQuality={handleEnhanceQuality} isLoading={isLoading} />;
            case 'crop': return <CropPanel profileConfig={profileConfig} onProfileConfigChange={setProfileConfig} isLoading={isLoading} onCreateProfilePic={handleCreateProfilePic} aspect={aspect} onAspectChange={setAspect} onApplyCrop={handleApplyCrop} onResetCrop={handleResetCrop} />;
            case 'remove': return <RemovePanel brushSize={removalBrushSize} onBrushSizeChange={setRemovalBrushSize} isLoading={isLoading} onApply={handleApplyObjectRemoval} onReset={handleResetMasks} hasMasks={removalMasks.length > 0} />;
            case 'text': return <TextPanel textElements={textElements} selectedElementId={selectedTextElementId} onAddText={handleAddText} onSelectText={setSelectedTextElementId} onUpdateText={handleUpdateTextElement} onDeleteText={handleDeleteTextElement} isLoading={isLoading} onApply={handleApplyTextToImage} onReset={handleResetText} />;
            case 'doodle': return <DoodlePanel mode={doodleMode} onModeChange={setDoodleMode} color={doodleColor} onColorChange={setDoodleColor} size={doodleSize} onSizeChange={setDoodleSize} isLoading={isLoading} onApply={handleApplyDoodles} onReset={handleResetDoodles} />;
            case 'watermark': return <WatermarkPanel config={watermarkConfig} onConfigChange={setWatermarkConfig} isLoading={isLoading} onApply={handleApplyWatermark} onReset={handleResetWatermark}/>;
            default: return null;
        }
    }
    
    const TopBarButton: React.FC<{onClick?: () => void, onMouseDown?: () => void, onMouseUp?: () => void, onMouseLeave?: () => void, onTouchStart?: () => void, onTouchEnd?: () => void, disabled?: boolean, children: React.ReactNode, ariaLabel: string, icon: React.FC<{className?: string}>}> = ({onClick, disabled, children, ariaLabel, icon: Icon, ...props}) => (
        <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={ariaLabel} {...props}>
          <Icon className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden md:inline">{children}</span>
        </button>
    );
    
    // Encapsulate JSX for reuse between mobile and desktop layouts
    const TopBar = (
      <div className="bg-white/80 border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
          <TopBarButton onClick={handleUndo} disabled={!canUndo} ariaLabel="Undo" icon={UndoIcon}>Undo</TopBarButton>
          <TopBarButton onClick={handleRedo} disabled={!canRedo} ariaLabel="Redo" icon={RedoIcon}>Redo</TopBarButton>
          {canUndo && <TopBarButton onClick={handleReset} ariaLabel="Reset All Changes" icon={ResetIcon}>Reset</TopBarButton>}
          {canUndo && (
            <TopBarButton 
              onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} onMouseLeave={() => setIsComparing(false)} 
              onTouchStart={() => setIsComparing(true)} onTouchEnd={() => setIsComparing(false)} 
              ariaLabel="Compare with original" icon={EyeIcon}>
              Compare
            </TopBarButton>
          )}
          <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1 rounded-lg">
            <ZoomIcon className="w-4 h-4 text-slate-400" />
            <input type="range" min="0.2" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-24 h-4 bg-slate-200" />
            <button onClick={() => setZoom(1)} className="text-xs font-semibold hover:text-slate-900 text-slate-600">{Math.round(zoom*100)}%</button>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <TopBarButton onClick={handleUploadNew} ariaLabel="Upload New Image" icon={UploadIcon}>Upload New</TopBarButton>
          <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-500 text-white transition-colors hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            <DownloadIcon className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Download</span>
          </button>
        </div>
      </div>
    );
    
    const ImageDisplayArea = (
      <div
        ref={imageContainerRef}
        className={`flex items-center justify-center overflow-auto relative h-full w-full ${activeTab === 'retouch' || activeTab === 'remove' ? 'cursor-crosshair' : ''}`}
        onClick={handleImageClick}
      >
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                <Spinner />
                <p className="text-slate-600">AI is working its magic...</p>
            </div>
        )}
        <div ref={zoomableContainerRef} className="relative transition-transform duration-200" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            onMouseDown={handleDrawStart} onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd} onTouchStart={handleDrawStart} onTouchMove={handleDrawMove} onTouchEnd={handleDrawEnd}>
          {activeTab === 'crop' ? (
            <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect} className="flex justify-center items-center max-h-full">
              <img ref={imgRef} key={`crop-${currentImageUrl}`} src={currentImageUrl} alt="Crop this image" className="shadow-lg" />
            </ReactCrop>
          ) : imageDisplay }
          <canvas ref={doodleCanvasRef} className={`absolute top-0 left-0 w-full h-full pointer-events-none z-20 ${activeTab === 'doodle' ? 'cursor-crosshair' : ''}`}></canvas>
          <canvas ref={removalMaskCanvasRef} className={`absolute top-0 left-0 w-full h-full pointer-events-none z-20 ${activeTab === 'remove' ? 'cursor-crosshair' : ''}`}></canvas>
          {activeTab === 'text' && textElements.map(el => (
              <div key={el.id} onMouseDown={(e) => onTextDragStart(e, el.id)} className={`absolute text-center select-none cursor-move p-1 transition-all duration-100 ${selectedTextElementId === el.id ? 'border-2 border-dashed border-primary-400' : 'border-2 border-transparent hover:border-black/10'}`}
                  style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)', color: el.color, fontFamily: el.fontFamily, fontSize: `clamp(0.5rem, ${el.size * 0.4}vw, 10rem)`, fontWeight: el.bold ? 'bold' : 'normal', textShadow: el.hasShadow ? '0 1px 3px rgba(0,0,0,0.4)' : 'none' }}>
                {el.text}
              </div>
          ))}
          {activeTab === 'watermark' && (
              <div style={getWatermarkPreviewStyles()}>
                  {watermarkConfig.type === 'text' && watermarkConfig.text && (<span style={{opacity: watermarkConfig.opacity, color: watermarkConfig.color, fontSize: `clamp(0.5rem, ${watermarkConfig.size * 0.4}vw, 5rem)`, fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>{watermarkConfig.text}</span>)}
                  {watermarkConfig.type === 'photo' && watermarkConfig.imageUrl && (<img src={watermarkConfig.imageUrl} alt="Watermark Preview" style={{opacity: watermarkConfig.opacity, width: `${watermarkConfig.size}%`, height: 'auto'}} />)}
              </div>
          )}
          {displayHotspot && !isLoading && activeTab === 'retouch' && (
              <div className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}><div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div></div>
          )}
        </div>
      </div>
    );

    const renderMobileNav = () => {
        const pathLevel = mobileNavPath.length;

        if (pathLevel === 0) {
            const mobileNavCategories: { id: string, name: string, icon: React.FC<{className?: string}> }[] = [
                { id: 'retouch', name: 'Retouch', icon: RetouchIcon },
                { id: 'edit', name: 'Edit', icon: EditIcon },
                { id: 'add', name: 'Add', icon: AddIcon },
            ];
            return (
                <nav className="flex items-center justify-around p-1 h-24 bg-white/95 border-t border-slate-200 backdrop-blur-lg">
                    {mobileNavCategories.map(cat => (
                        <button key={`mobile-cat-${cat.id}`} onClick={() => {
                            if (cat.id === 'retouch') {
                                setActiveTab('retouch');
                                setMobileNavPath(['retouch']);
                            } else {
                                const firstTool = navConfig[cat.id as keyof typeof navConfig][0];
                                setActiveTab(firstTool.id as Tab);
                                setMobileNavPath([cat.id, firstTool.id]);
                            }
                        }} className={`flex flex-col items-center justify-center gap-1 w-full h-20 rounded-lg transition-colors text-slate-500 hover:text-slate-800`}>
                            <cat.icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{cat.name}</span>
                        </button>
                    ))}
                </nav>
            );
        }
        
        const handleBack = () => {
            const newPath = mobileNavPath.slice(0, -1);
            if (newPath.length > 0) {
                 const newActiveTabId = newPath[newPath.length - 1];
                 const category = newPath[0];
                 const allTools = navConfig[category as keyof typeof navConfig] || [];
                 const newActiveTab = allTools.find(t => t.id === newActiveTabId)
                 if (newActiveTab) setActiveTab(newActiveTabId as Tab);
            }
            setMobileNavPath(newPath);
        };

        const resetActionMap: Partial<Record<Tab, { onReset: () => void, disabled: boolean }>> = {
            'adjust': { onReset: handleResetManualAdjustments, disabled: !isManuallyAdjusted },
            'crop': { onReset: handleResetCrop, disabled: !crop },
            'remove': { onReset: handleResetMasks, disabled: removalMasks.length === 0 },
            'text': { onReset: handleResetText, disabled: textElements.length === 0 },
            'doodle': { onReset: handleResetDoodles, disabled: doodleElements.length === 0 },
            'watermark': { onReset: handleResetWatermark, disabled: !hasWatermarkConfig },
        };
        const currentResetAction = resetActionMap[activeTab];

        const primaryActionMap: Partial<Record<Tab, { onApply: () => void, disabled: boolean, label: string }>> = {
            'retouch': { onApply: handleGenerate, disabled: isLoading || !prompt.trim() || !editHotspot, label: 'Generate' },
            'adjust': { onApply: handleApplyManualAdjustments, disabled: !isManuallyAdjusted, label: 'Apply' },
            'crop': { onApply: handleApplyCrop, disabled: !completedCrop?.width || completedCrop.width === 0, label: 'Apply' },
            'remove': { onApply: handleApplyObjectRemoval, disabled: removalMasks.length === 0, label: 'Apply' },
            'text': { onApply: handleApplyTextToImage, disabled: textElements.length === 0, label: 'Apply' },
            'doodle': { onApply: handleApplyDoodles, disabled: doodleElements.length === 0, label: 'Apply' },
            'watermark': { onApply: handleApplyWatermark, disabled: !hasWatermarkConfig, label: 'Apply' },
        };
        let currentPrimaryAction = primaryActionMap[activeTab];

        if (activeTab === 'crop' && mobileNavPath.includes('profile')) {
            currentPrimaryAction = { onApply: handleCreateProfilePic, disabled: isLoading, label: 'Create' };
        }

        let currentItems: TopLevelNavItem[] = [];
        let itemClickHandler: (item: TopLevelNavItem) => void = () => {};
        let activeItemId: string | undefined = mobileNavPath[mobileNavPath.length - 1];
        
        let navState = 'categories'; // categories -> tools -> subtools
        const categoryId = mobileNavPath[0] as keyof typeof navConfig;
        if (pathLevel > 1 && categoryId !== 'retouch') navState = 'tools';
        const toolId = mobileNavPath[1] as Tab;
        const tool = navConfig[categoryId]?.find(t => t.id === toolId);
        if (pathLevel > 2 && tool?.subTools) navState = 'subtools';

        switch (navState) {
            case 'categories':
                const category = mobileNavPath[0] as keyof typeof navConfig;
                currentItems = navConfig[category];
                itemClickHandler = (item) => {
                    setActiveTab(item.id as Tab);
                    setMobileNavPath(prev => [...prev, item.id]);
                };
                break;
            case 'tools':
            case 'subtools':
                currentItems = tool?.subTools || [];
                activeItemId = mobileNavPath[mobileNavPath.length-1];
                itemClickHandler = (item) => {
                    const newPath = [...mobileNavPath.slice(0, -1), item.id];
                    setMobileNavPath(newPath);

                    if (toolId === 'adjust') setActiveManualTool(item.id as ManualAdjustmentTool);
                    else if (toolId === 'doodle') setDoodleMode(item.id as DoodleMode);
                    else if (toolId === 'watermark') setWatermarkConfig(prev => ({...prev, type: item.id as 'text' | 'photo'}));
                    else if (toolId === 'crop') {
                        if (item.id === 'profile') {
                           setMobileNavPath([...newPath, profileConfig.shape]);
                        } else {
                           setAspect(item.value);
                        }
                    }
                };
                 if (toolId === 'crop' && mobileNavPath[2] === 'profile') {
                     if (mobileNavPath.length === 3) { // show shapes
                        currentItems = profileShapes;
                        activeItemId = profileConfig.shape;
                        itemClickHandler = (item) => {
                            setProfileConfig(p => ({...p, shape: item.id as ProfileConfig['shape']}));
                            setMobileNavPath(prev => [...prev, item.id]);
                        }
                     } else { // show backgrounds
                        currentItems = profileBackgrounds;
                        activeItemId = profileConfig.background;
                        itemClickHandler = (item) => {
                             setProfileConfig(p => ({...p, background: item.id as ProfileConfig['background']}));
                             setMobileNavPath(prev => [...prev.slice(0, -1), item.id]);
                        }
                     }
                 }
                break;
        }

        return (
             <nav className="flex items-center gap-1 p-2 bg-white/95 border-t border-slate-200 backdrop-blur-lg h-24">
                <button onClick={handleBack} className="p-2 text-slate-500 hover:text-slate-800 flex-shrink-0" aria-label="Back">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="border-l border-slate-300 h-6 mx-1 flex-shrink-0"></div>
                <div className="flex-grow flex items-center gap-1 overflow-x-auto hide-scrollbar">
                    {currentItems.map(item => (
                        <button key={`mobile-sub-${item.id}`} onClick={() => itemClickHandler(item)} className={`flex flex-col items-center justify-center gap-1 w-20 py-2 rounded-lg transition-colors flex-shrink-0 ${(activeItemId === item.id) ? 'text-primary-500 bg-primary-500/10' : 'text-slate-500 hover:text-slate-800'}`}>
                            <item.icon className="w-5 h-5" />
                            <span className="text-xs font-medium text-center">{item.name || item.displayName}</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                    {currentResetAction && (
                        <button onClick={currentResetAction.onReset} disabled={isLoading || currentResetAction.disabled} className="p-3 bg-slate-100 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-slate-200">
                            <ResetIcon className="w-6 h-6"/>
                        </button>
                    )}
                     {currentPrimaryAction && (
                        <button onClick={currentPrimaryAction.onApply} disabled={isLoading || currentPrimaryAction.disabled} className="px-5 py-3 bg-accent-green rounded-lg text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-green-600">
                            {currentPrimaryAction.label}
                        </button>
                    )}
                </div>
            </nav>
        );
    }
    
    return (
      <>
        {/* =================== DESKTOP LAYOUT =================== */}
        <div className="hidden md:flex flex-1 w-full flex-row gap-4 p-4 h-full max-h-[calc(100vh-53px)]">
            <div className="flex-1 flex flex-col gap-4">
                {TopBar}
                {ImageDisplayArea}
            </div>
            
            <div className="w-full md:w-[380px] max-h-full flex flex-col gap-4">
                <div className="flex bg-white border border-slate-200 rounded-xl p-2 items-center justify-center gap-1 backdrop-blur-sm shadow-sm">
                    {allNavItems.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden lg:inline">{tab.name}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 backdrop-blur-sm flex flex-col shadow-sm overflow-y-auto">
                    {renderPanel(activeTab)}
                </div>
            </div>
        </div>
        
        {/* =================== MOBILE LAYOUT =================== */}
        <div className="md:hidden flex flex-col w-full h-full max-h-screen bg-slate-50">
            {/* --- Mobile Top Bar (fixed) --- */}
            <div className="flex-shrink-0 z-20 bg-slate-50/95 backdrop-blur-sm">
                <div className="p-2">{TopBar}</div>
            </div>
            
            {/* --- Main Scrollable Content Area --- */}
            <div className="flex-1 relative overflow-y-auto pb-32">
            
                {/* --- Sticky Image Container --- */}
                <div className="sticky top-0 z-10 bg-slate-50 p-2 pt-0">
                    <div className="w-full aspect-square relative bg-slate-200/70 rounded-lg flex items-center justify-center overflow-hidden">
                        {ImageDisplayArea}
                    </div>
                </div>

                {/* --- Tool Options Panel (below the image) --- */}
                <div className="bg-white">
                    {mobileNavPath.length > 0 && (
                        <div className="p-4 animate-fade-in">
                            {renderPanel(activeTab)}
                        </div>
                    )}
                </div>
            </div>
            
            {/* --- Mobile Fixed Footer --- */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex-shrink-0">
                {renderMobileNav()}
            </footer>
        </div>
      </>
    );
  };
  
  return (
    <div className="min-h-screen text-slate-800 flex flex-col bg-slate-50">
      <main className={`flex-grow w-full max-w-[1600px] mx-auto flex ${currentImage ? '' : 'items-center justify-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;