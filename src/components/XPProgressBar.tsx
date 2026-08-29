import React from 'react';

interface XPProgressBarProps {
  percentage: number;
  label?: string;
  statusText?: string;
  showBlocks?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  percentage,
  label,
  statusText,
  showBlocks = true,
}) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const blockCount = Math.floor((clampedPct / 100) * 35);

  return (
    <div className="w-full">
      {(label || statusText) && (
        <div className="flex justify-between items-center mb-1 text-[11px] text-gray-800">
          <span className="font-semibold truncate max-w-[70%]">{label || 'Processing...'}</span>
          <span className="text-gray-600 font-mono">{clampedPct}%</span>
        </div>
      )}

      <div className="xp-progress-bar flex items-center bg-white">
        {showBlocks ? (
          <div className="flex items-center h-full overflow-hidden w-full px-0.5">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className={`xp-progress-chunk transition-opacity duration-150 ${
                  index < blockCount ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>
        ) : (
          <div
            className="xp-progress-continuous"
            style={{ width: `${clampedPct}%` }}
          />
        )}
      </div>

      {statusText && (
        <div className="text-[10px] text-gray-600 mt-1 truncate font-mono">
          {statusText}
        </div>
      )}
    </div>
  );
};
