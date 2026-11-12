import { getIconComponent } from '@/components/DeviceIconPicker';
import { GripVertical, ToggleLeft, ToggleRight, Pencil, X } from 'lucide-react';

const CATEGORY_COLORS = {
  heating: '#EF4444',
  cooling: '#3B82F6',
  lighting: '#AAFF00',
  appliances: '#F59E0B',
  entertainment: '#A855F7',
  kitchen: '#F97316',
  other: '#6B7280',
};

export default function DeviceRow({
  device,
  editMode,
  ratePerKwh,
  onToggle,
  onEdit,
  onRemove,
  dragHandleProps,
  innerRef,
  isDragging,
}) {
  const IconComp = getIconComponent(device.icon);
  const color = CATEGORY_COLORS[device.category] || '#6B7280';
  const dailyKwh = (device.kwh_per_hour || 0) * (device.daily_hours ?? 1);
  const monthlyCost = dailyKwh * 30 * ratePerKwh;

  return (
    <div
      ref={innerRef}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
        device.is_on ? 'bg-black/40 border-white/10' : 'bg-black/20 border-white/5 opacity-60'
      } ${isDragging ? 'opacity-80 shadow-lg ring-1 ring-lime/40' : ''}`}
    >
      {editMode && (
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0 text-white/30 hover:text-lime transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      <button
        onClick={() => onEdit(device)}
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
        style={{ background: `${color}20` }}
        title="View breakdown"
      >
        <IconComp className="w-4 h-4" style={{ color }} />
      </button>

      <button onClick={() => onEdit(device)} className="flex-1 min-w-0 text-left">
        <p className="font-display text-white text-sm">{device.name}</p>
        <p className="text-white/40 text-xs font-body">
          {device.kwh_per_hour} kWh/hr · R{monthlyCost.toFixed(0)}/mo
          {device.is_on && <span className="text-lime ml-2">● ACTIVE</span>}
        </p>
      </button>

      {!editMode && (
        <button
          onClick={() => onToggle(device)}
          className="flex-shrink-0 transition-colors"
          title={device.is_on ? 'Turn off' : 'Turn on'}
        >
          {device.is_on
            ? <ToggleRight className="w-8 h-8 text-lime" />
            : <ToggleLeft className="w-8 h-8 text-white/30" />}
        </button>
      )}

      <button
        onClick={() => onEdit(device)}
        className="text-white/30 hover:text-lime transition-colors flex-shrink-0"
        title="Edit / breakdown"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {editMode && (
        <button
          onClick={() => onRemove(device)}
          className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}