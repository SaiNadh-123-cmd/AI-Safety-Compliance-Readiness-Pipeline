import React, { useRef, useState } from "react";

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const TiltCard3D: React.FC<TiltCard3DProps> = ({ children, className = "", onClick, style }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rotateY = ((x / rect.width) - 0.5) * 14; // smooth -7deg to +7deg
    const rotateX = (0.5 - (y / rect.height)) * 14; // smooth -7deg to +7deg

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`);
    setGlow({ x: px, y: py, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlow((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transformStyle: "preserve-3d",
        transition: glow.opacity
          ? "transform 120ms cubic-bezier(0.23, 1, 0.32, 1), border-color 300ms ease"
          : "transform 600ms cubic-bezier(0.23, 1, 0.32, 1), border-color 300ms ease",
        ...style,
      }}
      className={`relative overflow-hidden rounded-2xl bg-[#041028]/70 backdrop-blur-xl border border-cyan-400/20 hover:border-cyan-300/65 shadow-[0_20px_50px_rgba(0,0,0,0.45)] hover:shadow-[0_28px_70px_rgba(0,229,255,0.22)] will-change-transform ${className}`}
    >
      {/* Dynamic Cursor-Following Cyan Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(420px circle at ${glow.x}% ${glow.y}%, rgba(0, 229, 255, 0.18), transparent 60%)`,
        }}
      />
      <div style={{ transform: "translateZ(20px)" }} className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

export default TiltCard3D;
