import { createPortal } from 'react-dom';

interface DistrictTooltipProps {
  x: number;
  y: number;
  districtNumber: number;
  senatorName: string;
}

export function DistrictTooltip({
  x,
  y,
  districtNumber,
  senatorName,
}: DistrictTooltipProps) {
  return createPortal(
    <div
      className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg py-2 px-3 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -120%)',
      }}
    >
      <div className="font-semibold">District {districtNumber}</div>
      <div className="text-gray-300">{senatorName}</div>
    </div>,
    document.body
  );
}
