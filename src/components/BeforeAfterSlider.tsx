/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Space, Sparkles, Sliders, CheckCircle, AlertCircle } from 'lucide-react';

export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // Shared high-fidelity car SVG rendering template
  const renderCarBody = (theme: 'dirty' | 'clean') => {
    const isClean = theme === 'clean';
    return (
      <svg
        viewBox="0 0 600 320"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background / Floor Gradient */}
        <defs>
          <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="bodyClean" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1D4ED8" /> {/* deep royal blue */}
            <stop offset="40%" stopColor="#2563EB" /> {/* royal blue */}
            <stop offset="100%" stopColor="#60A5FA" /> {/* hyper shine blue */}
          </linearGradient>
          <linearGradient id="bodyDirty" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4B5563" /> {/* dull grey */}
            <stop offset="50%" stopColor="#6B7280" /> 
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
          <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>

        {/* Floor Shadow */}
        <ellipse cx="300" cy="285" rx="260" ry="25" fill="url(#floorShadow)" />

        {/* CAR SHELL SHAPE */}
        {/* Wheels background axles */}
        <rect x="110" y="250" width="80" height="20" rx="5" fill="#1F2937" />
        <rect x="410" y="250" width="80" height="20" rx="5" fill="#1F2937" />

        {/* Main Body Structure */}
        <path
          d="M 60 220 
             C 60 200, 80 160, 110 150 
             C 120 147, 137 148, 160 145 
             C 185 100, 240 70, 310 70 
             C 380 70, 440 85, 470 120 
             C 490 125, 520 135, 535 150 
             C 555 170, 560 195, 555 220 
             ... 550 240, 540 245, 515 245
             C 500 210, 440 210, 425 245
             L 195 245
             C 180 210, 120 210, 105 245
             C 85 245, 65 240, 60 220 Z"
          fill={isClean ? 'url(#bodyClean)' : 'url(#bodyDirty)'}
          stroke={isClean ? '#3B82F6' : '#9CA3AF'}
          strokeWidth="3"
        />

        {/* Windows and pillars */}
        <path
          d="M 185 135 
             L 245 92 
             C 255 90, 305 90, 305 90
             L 305 135 Z"
          fill={isClean ? '#93C5FD' : '#9CA3AF'}
          opacity="0.75"
          stroke={isClean ? '#2563EB' : '#6B7280'}
          strokeWidth="2"
        />
        <path
          d="M 315 135 
             L 315 90 
             C 315 90, 375 90, 395 100 
             C 415 110, 435 125, 445 135 Z"
          fill={isClean ? '#93C5FD' : '#9CA3AF'}
          opacity="0.75"
          stroke={isClean ? '#2563EB' : '#6B7280'}
          strokeWidth="2"
        />

        {/* Window Reflection stripes for clean car */}
        {isClean && (
          <>
            <path d="M 210 135 L 255 96" stroke="#FFFFFF" strokeWidth="4" opacity="0.5" strokeLinecap="round" />
            <path d="M 345 135 L 385 103" stroke="#FFFFFF" strokeWidth="4" opacity="0.5" strokeLinecap="round" />
          </>
        )}

        {/* Tires */}
        {/* Rear Tire */}
        <circle cx="150" cy="240" r="45" fill="url(#wheelGrad)" stroke="#111827" strokeWidth="3" />
        <circle cx="150" cy="240" r="28" fill="#1F2937" />
        <circle cx="150" cy="240" r="18" fill={isClean ? '#D1D5DB' : '#4B5563'} stroke="#111827" strokeWidth="1" />
        {/* Tire Spokes */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={`r-spoke-${angle}`}
            x1="150"
            y1="240"
            x2={150 + Math.cos((angle * Math.PI) / 180) * 26}
            y2={240 + Math.sin((angle * Math.PI) / 180) * 26}
            stroke={isClean ? '#E5E7EB' : '#6B7280'}
            strokeWidth="3"
          />
        ))}

        {/* Front Tire */}
        <circle cx="470" cy="240" r="45" fill="url(#wheelGrad)" stroke="#111827" strokeWidth="3" />
        <circle cx="470" cy="240" r="28" fill="#1F2937" />
        <circle cx="470" cy="240" r="18" fill={isClean ? '#D1D5DB' : '#4B5563'} stroke="#111827" strokeWidth="1" />
        {/* Tire Spokes */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={`f-spoke-${angle}`}
            x1="470"
            y1="240"
            x2={470 + Math.cos((angle * Math.PI) / 180) * 26}
            y2={240 + Math.sin((angle * Math.PI) / 180) * 26}
            stroke={isClean ? '#E5E7EB' : '#6B7280'}
            strokeWidth="3"
          />
        ))}

        {/* Headlights & Tail lights */}
        <path d="M 545 160 C 555 165, 555 180, 545 185 Z" fill={isClean ? '#FDE047' : '#9CA3AF'} stroke={isClean ? '#F59E0B' : '#6B7280'} strokeWidth="1.5" />
        <path d="M 62 170 C 52 170, 52 185, 62 185 Z" fill={isClean ? '#EF4444' : '#6B7280'} stroke="#B91C1C" strokeWidth="1.5" />

        {/* Door Handles, Panel boundaries */}
        <path d="M 290 145 L 290 243" stroke={isClean ? '#1E40AF' : '#4B5563'} strokeWidth="2" opacity="0.6" />
        <path d="M 125 152 Q 220 162 300 160" stroke={isClean ? '#1E40AF' : '#4B5563'} strokeWidth="1.5" opacity="0.4" />
        <path d="M 300 160 Q 420 162 535 153" stroke={isClean ? '#1E40AF' : '#4B5563'} strokeWidth="1.5" opacity="0.4" />
        <rect x="255" y="153" width="22" height="6" rx="2" fill={isClean ? '#E5E7EB' : '#4B5563'} stroke="#1F2937" strokeWidth="1" />
        <rect x="330" y="153" width="22" height="6" rx="2" fill={isClean ? '#E5E7EB' : '#4B5563'} stroke="#1F2937" strokeWidth="1" />

        {/* SPECIAL EFFECTS */}
        {/* Dirt, Mud stains, Spattered dust overlay on Dirty car */}
        {!isClean && (
          <g id="dirty-overlay">
            {/* Spotted Speckles */}
            <ellipse cx="140" cy="225" rx="30" ry="12" fill="#D97706" opacity="0.4" filter="blur(2px)" />
            <ellipse cx="230" cy="235" rx="55" ry="15" fill="#78350F" opacity="0.5" filter="blur(3px)" />
            <ellipse cx="440" cy="230" rx="35" ry="12" fill="#78350F" opacity="0.4" filter="blur(2px)" />
            <circle cx="340" cy="180" r="14" fill="#B45309" opacity="0.30" />
            <circle cx="180" cy="190" r="18" fill="#B45309" opacity="0.30" />
            <circle cx="480" cy="190" r="15" fill="#B45309" opacity="0.35" />
            {/* Water streaks */}
            <path d="M210 155 Q205 180 215 200" stroke="#78350F" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
            <path d="M370 155 Q365 185 375 210" stroke="#78350F" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
            <path d="M420 150 Q425 175 415 195" stroke="#78350F" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
            <path d="M125 175 Q130 200 120 220" stroke="#78350F" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
          </g>
        )}

        {/* Shiny High-Gloss Accents on Clean car */}
        {isClean && (
          <g id="clean-reflections">
            {/* Sleek metallic reflection swoosh */}
            <path
              d="M 80 200 Q 220 180 500 185"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            {/* Secondary reflection highlighted hood */}
            <path
              d="M 450 120 Q 480 130 530 145"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            
            {/* Shimmer Stars (Visual magic glow/sparkle) */}
            <g transform="translate(140, 140)">
              <path d="M 0,-12 L 3,-3 L 12,0 L 3,3 L 0,12 L -3,3 L -12,0 L -3,-3 Z" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="2" fill="#60A5FA" />
            </g>
            <g transform="translate(480, 115) scale(0.8)">
              <path d="M 0,-12 L 3,-3 L 12,0 L 3,3 L 0,12 L -3,3 L -12,0 L -3,-3 Z" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="2" fill="#F97316" />
            </g>
            <g transform="translate(290, 75) scale(0.6)">
              <path d="M 0,-12 L 3,-3 L 12,0 L 3,3 L 0,12 L -3,3 L -12,0 L -3,-3 Z" fill="#FFFFFF" />
            </g>
            <g transform="translate(530, 140) scale(0.7)">
              <path d="M 0,-12 L 3,-3 L 12,0 L 3,3 L 0,12 L -3,3 L -12,0 L -3,-3 Z" fill="#FFFFFF" />
            </g>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div id="before-after-module" className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 mb-2">
          <Sliders className="w-3.5 h-3.5" /> Drag and Discover
        </span>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Witness the Verified Difference
        </h3>
        <p className="text-slate-500 text-sm mt-1 max-w-lg mx-auto">
          Drag the scrubber to see how ChakaChak removes abrasive dust without spreading dirt or leaving severe micro-scratches.
        </p>
      </div>

      {/* Slider Container */}
      <div
        ref={containerRef}
        className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-50 select-none cursor-ew-resize"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches[0]) {
            handleMove(e.touches[0].clientX);
          }
        }}
      >
        {/* Underlay: The Before/Dirty Car */}
        <div className="absolute inset-0 w-full h-full p-4 flex items-center justify-center">
          {renderCarBody('dirty')}
        </div>

        {/* Labels overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm text-white text-xs md:text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Before: Quick Wipe, Spread Dust & Micro-scratches</span>
        </div>

        {/* Overlay: The After/Clean Car (Clipped based on sliderPosition) */}
        <div
          className="absolute inset-0 h-full p-4 flex items-center justify-center overflow-hidden transition-all duration-75"
          style={{ width: `${sliderPosition}%` }}
        >
          <div
            className="absolute inset-0 p-4 flex items-center justify-center bg-blue-50/10"
            style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }}
          >
            {renderCarBody('clean')}
          </div>
        </div>

        <div
          className="absolute bottom-4 right-4 z-10 bg-blue-600/90 backdrop-blur-sm text-white text-xs md:text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
          style={{ opacity: sliderPosition < 90 ? 1 : 0.1 }}
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>After ChakaChak: Verified Polish & 100% Gloss</span>
        </div>

        {/* Interactive Sliding Bar */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-orange-500 z-20 cursor-ew-resize shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Central Handle Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-orange-500 text-white shadow-2xl border-2 border-white flex items-center justify-center active:scale-110 active:bg-orange-600 transition-all">
            <Sliders className="w-5 h-5 rotate-90" />
          </div>
          {/* Pulse Ripple */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 border-orange-400/40 animate-ping -z-10" />
        </div>
      </div>

      <div className="mt-4 flex justify-between px-2 text-xs font-semibold text-slate-400 tracking-wider">
        <span className="flex items-center gap-1 text-slate-500"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> TAP & SLIDE LEFT</span>
        <span className="flex items-center gap-1 text-blue-600">SLIDE RIGHT TO INSPECT <Sparkles className="w-3.5 h-3.5" /></span>
      </div>
    </div>
  );
}
