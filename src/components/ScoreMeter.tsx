import React, { useEffect, useState } from 'react';

interface CircularScoreMeterProps {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export const CircularScoreMeter: React.FC<CircularScoreMeterProps> = ({
  score,
  label,
  size = 180,
  strokeWidth = 12
}) => {
  const [offset, setOffset] = useState(0);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progressOffset = circumference - (score / 100) * circumference;
    const timer = setTimeout(() => {
      setOffset(progressOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  // Determine colors based on score value
  let strokeColor = 'stroke-cyberCyan';
  let glowColor = 'rgba(102, 252, 241, 0.4)';
  let textColor = 'text-cyberCyan';

  if (score >= 90) {
    strokeColor = 'stroke-successGreen';
    glowColor = 'rgba(0, 230, 118, 0.4)';
    textColor = 'text-successGreen';
  } else if (score < 60) {
    strokeColor = 'stroke-red-500';
    glowColor = 'rgba(239, 68, 68, 0.4)';
    textColor = 'text-red-500';
  } else if (score < 80) {
    strokeColor = 'stroke-yellow-400';
    glowColor = 'rgba(250, 204, 21, 0.4)';
    textColor = 'text-yellow-400';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track circle */}
          <circle
            className="stroke-darkCard"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground glowing stroke circle */}
          <circle
            className={`${strokeColor} progress-ring__circle`}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 8px ${glowColor})`
            }}
          />
        </svg>
        {/* Core numbers overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold tracking-tighter ${textColor}`}>
            {score}
          </span>
          <span className="text-gray-400 text-xs uppercase tracking-widest mt-1 font-semibold">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

interface BarScoreMeterProps {
  score: number;
  label: string;
  maxScore?: number;
}

export const BarScoreMeter: React.FC<BarScoreMeterProps> = ({
  score,
  label,
  maxScore = 100
}) => {
  const [widthPercent, setWidthPercent] = useState(0);

  useEffect(() => {
    const percentage = (score / maxScore) * 100;
    const timer = setTimeout(() => {
      setWidthPercent(percentage);
    }, 150);
    return () => clearTimeout(timer);
  }, [score, maxScore]);

  let barBg = 'bg-cyberCyan shadow-glow';
  if (score >= 90) barBg = 'bg-successGreen shadow-[0_0_10px_rgba(0,230,118,0.5)]';
  else if (score < 60) barBg = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  else if (score < 80) barBg = 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]';

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300 font-semibold">{label}</span>
        <span className="font-mono font-bold text-gray-100">{score} / {maxScore}</span>
      </div>
      <div className="w-full bg-darkBg/60 h-3 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barBg}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
};
