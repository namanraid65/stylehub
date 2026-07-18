"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Play, Pause, RotateCw, MoveHorizontal, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";

interface ThreeSixtyViewerProps {
  images: string[];
  productName: string;
}

export default function ThreeSixtyViewer({ images, productName }: ThreeSixtyViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef(0);
  const indexStartRef = useRef(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalFrames = images.length;

  // Auto-play rotation logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalFrames);
      }, 150);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, totalFrames]);

  // Touch and Mouse Drag handlers
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setIsPlaying(false);
    dragStartRef.current = clientX;
    indexStartRef.current = currentIndex;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current;
    
    // Sensitivity: 15px drag corresponds to 1 frame rotation
    const sensitivity = 15;
    const frameOffset = Math.round(deltaX / sensitivity);
    
    // Calculate new frame index wrapping around
    let newIndex = (indexStartRef.current - frameOffset) % totalFrames;
    if (newIndex < 0) {
      newIndex = totalFrames + newIndex;
    }
    setCurrentIndex(newIndex);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomScale((prev) => {
      if (direction === 'in') return Math.min(prev + 0.25, 2.5);
      return Math.max(prev - 0.25, 1);
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-200 transition-all duration-300 rounded-3xl ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none flex items-center justify-center p-6 bg-neutral-900/95 backdrop-blur-md" : "aspect-[3/4]"
      }`}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => e.touches[0] && handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      {/* Immersive Pedestal Display & soft shadow */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-neutral-900/10 rounded-full blur-xl transition-all ${
        isFullscreen ? "bottom-24" : ""
      }`} />

      {/* Render Active Product Image */}
      <div 
        className="relative w-full h-full select-none cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center"
        }}
      >
        <Image
          src={images[currentIndex]!}
          alt={`${productName} 360 degree angle ${currentIndex + 1}`}
          fill
          priority
          draggable={false}
          className="object-contain p-4"
        />
      </div>

      {/* Drag Instruction Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/30 shadow-sm pointer-events-none transition-opacity duration-300">
        <MoveHorizontal className="h-4 w-4 text-[var(--charcoal)] animate-pulse" />
        <span className="text-xs font-body font-medium text-[var(--charcoal)]">Drag to Rotate 360°</span>
      </div>

      {/* Immersive Control HUD */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/80 backdrop-blur-lg border border-neutral-200/50 shadow-lg z-10 transition-all ${
        isFullscreen ? "bottom-10" : ""
      }`}>
        {/* Play/Pause Auto-Rotate */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-[var(--charcoal)]"
          title={isPlaying ? "Pause Rotation" : "Auto Rotate"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        {/* Rotate Right manually */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % totalFrames); }}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-[var(--charcoal)]"
          title="Rotate Frame"
        >
          <RotateCw className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200" />

        {/* Zoom Controls */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleZoom('in'); }}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-[var(--charcoal)]"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleZoom('out'); }}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-[var(--charcoal)]"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200" />

        {/* Fullscreen Controls */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-[var(--charcoal)]"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        {/* Frame / Angle Indicator */}
        <span className="hidden sm:inline text-xs font-body font-semibold text-[var(--muted)] pl-2">
          {currentIndex + 1} / {totalFrames}
        </span>
      </div>
    </div>
  );
}
