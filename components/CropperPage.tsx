import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import { Button } from './ui/button';
import Image from 'next/image';
import { 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  RefreshCw, 
  Download,
  X,
  Info,
  HelpCircle
} from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

// 定義 props 型別
interface CropperPageProps {
  image: string;
  onCancel: () => void;
  onCropComplete: (cropped: string) => void;
}



// 計算檔案大小的函數
function calculateFileSize(width: number, height: number): string {
  const pixels = width * height;
  const bytes = pixels * 3; // 假設每像素 3 bytes (RGB)
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 裁切函數（保持原始解析度和品質）
function getCroppedImg(image: HTMLImageElement, crop: Crop): string | null {
  if (!crop.width || !crop.height) return null;
  const canvas = document.createElement('canvas');
  
  // 計算縮放比例（顯示尺寸與原始尺寸的比例）
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  // 重要：Canvas 尺寸要基於原始圖片尺寸，不是顯示尺寸
  const cropWidthOnOriginal = crop.width * scaleX;
  const cropHeightOnOriginal = crop.height * scaleY;
  
  canvas.width = cropWidthOnOriginal;
  canvas.height = cropHeightOnOriginal;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // 從原始圖片裁切，保持完整解析度
  ctx.drawImage(
    image,
    crop.x * scaleX,  // 原始圖片上的 X 位置
    crop.y * scaleY,  // 原始圖片上的 Y 位置
    cropWidthOnOriginal,  // 原始圖片上的裁切寬度
    cropHeightOnOriginal, // 原始圖片上的裁切高度
    0,  // Canvas 上的 X 位置
    0,  // Canvas 上的 Y 位置
    cropWidthOnOriginal,  // Canvas 上的寬度（保持原始尺寸）
    cropHeightOnOriginal  // Canvas 上的高度（保持原始尺寸）
  );
  
  // 使用 PNG 格式保持無損品質
  return canvas.toDataURL('image/png');
}

export default function CropperPage({ image, onCancel, onCropComplete }: CropperPageProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);

  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 初始化裁切區域
  const onImageLoad = useCallback(() => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      setDimensions({ width: naturalWidth, height: naturalHeight });
      
      // 設定初始裁切區域為圖片的80%
      setCrop({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80
      });
      setImageLoaded(true);
    }
  }, []);

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDone();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === 'h' || e.key === 'H') {
        setFlipHorizontal(!flipHorizontal);
      } else if (e.key === 'v' || e.key === 'V') {
        setFlipVertical(!flipVertical);
      } else if (e.key === '?' || e.key === 'F1') {
        setShowHelp(!showHelp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipHorizontal, flipVertical, showHelp, onCancel]);

  // 更新預覽圖片
  useEffect(() => {
    if (imgRef.current && completedCrop) {
      const preview = getCroppedImg(imgRef.current, completedCrop);
      setPreviewImage(preview);
    }
  }, [completedCrop]);

  // 處理完成裁切
  const handleDone = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    setIsLoading(true);
    try {
      const cropped = getCroppedImg(imgRef.current, completedCrop);
      if (cropped) {
        onCropComplete(cropped);
      }
    } catch (error) {
      console.error('裁切失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 旋轉圖片
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // 重設所有設定
  const handleReset = () => {
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    });
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setPreviewImage(null);
  };

  // 計算圖片轉換樣式
  const getImageTransform = () => {
    const transforms = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipHorizontal) transforms.push('scaleX(-1)');
    if (flipVertical) transforms.push('scaleY(-1)');
    return transforms.join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col">
      {/* 頂部工具列 */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 md:p-4">
        <div className="max-w-7xl mx-auto">
          {/* 手機版：工具列 */}
          <div className="lg:hidden">
            {/* 圖片操作工具 */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                title="旋轉 90° (R)"
                className="flex items-center gap-1 px-3"
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden xs:inline">旋轉</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipHorizontal(!flipHorizontal)}
                title="水平翻轉 (H)"
                className="flex items-center gap-1 px-3"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="hidden xs:inline">水平</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipVertical(!flipVertical)}
                title="垂直翻轉 (V)"
                className="flex items-center gap-1 px-3"
              >
                <FlipVertical className="w-4 h-4" />
                <span className="hidden xs:inline">垂直</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="重設所有設定"
                className="flex items-center gap-1 px-3"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden xs:inline">重設</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                title="顯示幫助 (?)"
                className="flex items-center gap-1 px-3"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden xs:inline">幫助</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                title="顯示預覽"
                className="flex items-center gap-1 px-3"
              >
                <Info className="w-4 h-4" />
                <span className="hidden xs:inline">預覽</span>
              </Button>
            </div>
          </div>

          {/* 桌面版：工具列 */}
          <div className="hidden lg:flex items-center justify-center">
            {/* 圖片操作工具 */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                title="旋轉 90° (R)"
                className="flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>旋轉</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipHorizontal(!flipHorizontal)}
                title="水平翻轉 (H)"
                className="flex items-center gap-2"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>水平翻轉</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipVertical(!flipVertical)}
                title="垂直翻轉 (V)"
                className="flex items-center gap-2"
              >
                <FlipVertical className="w-4 h-4" />
                <span>垂直翻轉</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="重設所有設定"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重設</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                title="顯示幫助 (?)"
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>幫助</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：裁切區域 */}
        <div className="flex-1 flex items-center justify-center p-2 md:p-4 bg-gray-800">
          <div className="relative max-w-full max-h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>載入圖片中...</p>
                </div>
              </div>
            )}
            
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
              className="bg-white rounded-lg shadow-2xl"
            >
              <Image
                ref={imgRef}
                src={image}
                alt="裁切圖片"
                width={800}
                height={600}
                style={{
                  objectFit: 'contain',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: getImageTransform(),
                }}
                onLoad={(e) => {
                  imgRef.current = e.currentTarget;
                  onImageLoad();
                }}
                unoptimized
                className="block max-w-[95vw] max-h-[60vh] lg:max-w-[80vw] lg:max-h-[70vh]"
              />
            </ReactCrop>
          </div>
        </div>

        {/* 右側：預覽面板 (桌面版) */}
        <div className="hidden lg:block w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* 預覽標題 */}
            <div className="flex items-center gap-2 text-white">
              <Info className="w-5 h-5" />
              <h3 className="font-medium">裁切預覽</h3>
            </div>

            {/* 預覽圖片 */}
            {previewImage && (
              <div className="bg-gray-700 rounded-lg p-4">
                <img
                  src={previewImage}
                  alt="裁切預覽"
                  className="w-full h-auto rounded border border-gray-600"
                />
              </div>
            )}

            {/* 尺寸資訊 */}
            {completedCrop && (
              <div className="bg-gray-700 rounded-lg p-4 text-white text-sm space-y-2">
                <h4 className="font-medium mb-2">裁切資訊</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">寬度:</span>
                    <br />
                    <span className="font-mono">{Math.round(completedCrop.width)}px</span>
                  </div>
                  <div>
                    <span className="text-gray-400">高度:</span>
                    <br />
                    <span className="font-mono">{Math.round(completedCrop.height)}px</span>
                  </div>
                  <div>
                    <span className="text-gray-400">比例:</span>
                    <br />
                    <span className="font-mono">
                      {(completedCrop.width / completedCrop.height).toFixed(2)}:1
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">大小:</span>
                    <br />
                    <span className="font-mono">
                      {calculateFileSize(completedCrop.width, completedCrop.height)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 原始圖片資訊 */}
            {dimensions.width > 0 && (
              <div className="bg-gray-700 rounded-lg p-4 text-white text-sm">
                <h4 className="font-medium mb-2">原始圖片</h4>
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-400">尺寸:</span>
                    <span className="font-mono ml-2">
                      {dimensions.width} × {dimensions.height}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">比例:</span>
                    <span className="font-mono ml-2">
                      {(dimensions.width / dimensions.height).toFixed(2)}:1
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 快捷鍵說明 */}
            {showHelp && (
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 text-white text-sm">
                <h4 className="font-medium mb-2">快捷鍵</h4>
                <div className="space-y-1">
                  <div><kbd className="bg-gray-600 px-1 rounded text-xs">Enter</kbd> 完成裁切</div>
                  <div><kbd className="bg-gray-600 px-1 rounded text-xs">Esc</kbd> 取消</div>
                  <div><kbd className="bg-gray-600 px-1 rounded text-xs">R</kbd> 旋轉</div>
                  <div><kbd className="bg-gray-600 px-1 rounded text-xs">H</kbd> 水平翻轉</div>
                  <div><kbd className="bg-gray-600 px-1 rounded text-xs">V</kbd> 垂直翻轉</div>
                  <div><kbd className="bg-gray-600 px-1 rounded text-xs">?</kbd> 顯示幫助</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 手機版預覽面板 */}
      {showPreview && (
        <div className="lg:hidden bg-gray-800 border-t border-gray-700 p-4 max-h-[40vh] overflow-y-auto">
          <div className="space-y-3">
            {/* 預覽圖片 */}
            {previewImage && (
              <div className="bg-gray-700 rounded-lg p-3">
                <img
                  src={previewImage}
                  alt="裁切預覽"
                  className="w-full h-auto rounded border border-gray-600 max-h-32 object-contain"
                />
              </div>
            )}

            {/* 裁切資訊 */}
            {completedCrop && (
              <div className="bg-gray-700 rounded-lg p-3 text-white text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">尺寸:</span>
                    <div className="font-mono text-xs">
                      {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">比例:</span>
                    <div className="font-mono text-xs">
                      {(completedCrop.width / completedCrop.height).toFixed(2)}:1
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 快捷鍵說明 */}
            {showHelp && (
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3 text-white text-sm">
                <h4 className="font-medium mb-2">快捷鍵</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><kbd className="bg-gray-600 px-1 rounded">Enter</kbd> 完成</div>
                  <div><kbd className="bg-gray-600 px-1 rounded">Esc</kbd> 取消</div>
                  <div><kbd className="bg-gray-600 px-1 rounded">R</kbd> 旋轉</div>
                  <div><kbd className="bg-gray-600 px-1 rounded">H</kbd> 水平翻轉</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部操作區域 */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 md:p-4">
        <div className="flex justify-center items-center gap-3 md:gap-4 max-w-7xl mx-auto">
          {/* 取消按鈕 */}
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex items-center gap-2 min-h-[44px] px-4 md:px-6"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
            取消
          </Button>

          {/* 完成按鈕 */}
          <Button
            onClick={handleDone}
            disabled={!completedCrop || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 min-w-[120px] md:min-w-[140px] min-h-[44px] px-4 md:px-6"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="hidden xs:inline">處理中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                完成裁切
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 