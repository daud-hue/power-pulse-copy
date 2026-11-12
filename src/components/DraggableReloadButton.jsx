import { useState, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';

const STORAGE_KEY = 'reloadButtonX';

export default function DraggableReloadButton({ onClick }) {
  const [xPercent, setXPercent] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? parseFloat(saved) : 100;
  });
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);
  const btnRef = useRef(null);

  const updateFromClientX = (clientX) => {
    const width = window.innerWidth;
    const margin = 24;
    const btnWidth = btnRef.current?.offsetWidth || 130;
    const minX = margin;
    const maxX = width - btnWidth - margin;
    const clamped = Math.min(maxX, Math.max(minX, clientX - btnWidth / 2));
    const percent = maxX > minX ? ((clamped - minX) / (maxX - minX)) * 100 : 100;
    setXPercent(percent);
  };

  const handlePointerDown = (e) => {
    setDragging(true);
    movedRef.current = false;
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      movedRef.current = true;
      updateFromClientX(clientX);
    };
    const handleUp = () => {
      setDragging(false);
      localStorage.setItem(STORAGE_KEY, xPercent.toString());
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, xPercent]);

  const width = typeof window !== 'undefined' ? window.innerWidth : 400;
  const margin = 24;
  const btnWidth = btnRef.current?.offsetWidth || 130;
  const minX = margin;
  const maxX = width - btnWidth - margin;
  const leftPx = minX + (xPercent / 100) * (maxX - minX);

  return (
    <button
      ref={btnRef}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onClick={() => { if (!movedRef.current) onClick(); }}
      className="fixed bottom-6 z-40 bg-lime text-black font-display text-sm px-5 py-3.5 rounded-full flex items-center gap-2 hover:bg-lime/90 transition-all lime-glow shadow-lg shadow-lime/25 active:scale-95 cursor-grab active:cursor-grabbing select-none"
      style={{ left: `${leftPx}px`, touchAction: 'none' }}
      title="Reload electricity (drag to move)"
    >
      <Zap className="w-4 h-4" fill="black" />
      RELOAD
    </button>
  );
}