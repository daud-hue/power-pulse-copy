import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus, ToggleLeft, ToggleRight, Pencil, GripVertical, ArrowDownWideNarrow, ArrowLeft, Save,
  Trash2, Clock, Zap, TrendingUp, Calendar,
} from 'lucide-react';
import DeviceIconPicker, { getIconComponent, DEVICE_ICON_CATEGORIES } from '@/components/DeviceIconPicker';
import DeviceRow from '@/components/DeviceRow';
import DeviceAISearch from '@/components/DeviceAISearch';

const CATEGORY_COLORS = {
  heating: '#EF4444',
  cooling: '#3B82F6',
  lighting: '#AAFF00',
  appliances: '#F59E0B',
  entertainment: '#A855F7',
  kitchen: '#F97316',
  other: '#6B7280',
};

const DEFAULT_DEVICES = [
  { name: 'Geyser', icon: 'Thermometer', kwh_per_hour: 4.0, is_on: true, category: 'heating', daily_hours: 3 },
  { name: 'Air Conditioner', icon: 'Wind', kwh_per_hour: 2.5, is_on: false, category: 'cooling', daily_hours: 4 },
  { name: 'Washing Machine', icon: 'WashingMachine', kwh_per_hour: 1.8, is_on: false, category: 'appliances', daily_hours: 1 },
  { name: 'TV', icon: 'Tv', kwh_per_hour: 0.15, is_on: true, category: 'entertainment', daily_hours: 5 },
  { name: 'Lighting', icon: 'Lightbulb', kwh_per_hour: 0.3, is_on: true, category: 'lighting', daily_hours: 6 },
  { name: 'Stove / Hob', icon: 'Flame', kwh_per_hour: 3.0, is_on: false, category: 'kitchen', daily_hours: 1.5 },
];

const RATE = 2.85;

export default function DeviceManager({ transactions }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sortedMode, setSortedMode] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newKwh, setNewKwh] = useState('');
  const [newHours, setNewHours] = useState('1');
  const [newCategory, setNewCategory] = useState('appliances');
  const [newIcon, setNewIcon] = useState('Zap');

  // Rate per kWh from transactions
  const ratePerKwh = (() => {
    const recent = (transactions || []).filter(t => t.amount_paid_zar > 0 && t.kwh_added > 0);
    if (recent.length === 0) return RATE;
    return recent.reduce((s, t) => s + t.amount_paid_zar / t.kwh_added, 0) / recent.length;
  })();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    let list = await base44.entities.Device.list('sort_order', 50);
    if (list.length === 0) {
      const created = await base44.entities.Device.bulkCreate(DEFAULT_DEVICES);
      list = created;
    }
    // Sort by sort_order (fallback to created order)
    list.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    setDevices(list);
    setLoading(false);
  };

  const toggle = async (device) => {
    await base44.entities.Device.update(device.id, { is_on: !device.is_on });
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_on: !d.is_on } : d));
  };

  const removeDevice = async (device) => {
    await base44.entities.Device.delete(device.id);
    setDevices(prev => prev.filter(d => d.id !== device.id));
  };

  const moveDevice = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= devices.length) return;
    const reordered = [...devices];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await persistOrder(reordered);
  };

  const persistOrder = async (reordered) => {
    const updates = reordered.map((d, i) => ({ ...d, sort_order: i }));
    setDevices(updates);
    await base44.entities.Device.bulkUpdate(updates.map(d => ({ id: d.id, sort_order: d.sort_order })));
  };

  const onDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...devices];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await persistOrder(reordered);
  };

  const sortByUsage = () => {
    if (sortedMode) {
      // Restore priority order
      const restored = [...devices].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      setDevices(restored);
      setSortedMode(false);
    } else {
      // Sort by monthly kWh descending (biggest users first)
      const sorted = [...devices].sort((a, b) => {
        const aKwh = (a.kwh_per_hour || 0) * (a.daily_hours ?? 1);
        const bKwh = (b.kwh_per_hour || 0) * (b.daily_hours ?? 1);
        return bKwh - aKwh;
      });
      setDevices(sorted);
      setSortedMode(true);
    }
  };

  const addDevice = async () => {
    if (!newName || !newKwh) return;
    setSaving(true);
    const created = await base44.entities.Device.create({
      name: newName,
      icon: newIcon,
      kwh_per_hour: parseFloat(newKwh),
      is_on: false,
      category: newCategory,
      daily_hours: parseFloat(newHours) || 1,
      sort_order: devices.length,
    });
    setDevices(prev => [...prev, created]);
    setNewName(''); setNewKwh(''); setNewHours('1'); setNewCategory('appliances'); setNewIcon('Zap');
    setShowAdd(false);
    setSaving(false);
  };

  const saveEdit = async (updates) => {
    setSaving(true);
    await base44.entities.Device.update(editingDevice.id, updates);
    setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, ...updates } : d));
    setEditingDevice(prev => ({ ...prev, ...updates }));
    setSaving(false);
  };

  const activeKwh = devices.filter(d => d.is_on).reduce((s, d) => s + (d.kwh_per_hour || 0), 0);
  const totalKwh = devices.reduce((s, d) => s + (d.kwh_per_hour || 0), 0);

  if (loading) return (
    <div className="card-dark p-6 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-lime/20 border-t-lime rounded-full animate-spin" />
    </div>
  );

  // ── DEVICE DETAIL / EDIT VIEW ──
  if (editingDevice) {
    const Icon = getIconComponent(editingDevice.icon);
    const color = CATEGORY_COLORS[editingDevice.category] || '#6B7280';
    const dailyKwh = (editingDevice.kwh_per_hour || 0) * (editingDevice.daily_hours ?? 1);
    const monthlyKwh = dailyKwh * 30;
    const monthlyCost = monthlyKwh * ratePerKwh;
    const yearlyCost = monthlyCost * 12;
    const dailyCost = dailyKwh * ratePerKwh;

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => setEditingDevice(null)}
          className="flex items-center gap-2 text-white/50 hover:text-lime text-xs font-display transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO DEVICES
        </button>

        {/* Device header */}
        <div className="card-dark p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
              <Icon className="w-7 h-7" style={{ color }} />
            </div>
            <div className="flex-1">
              <p className="font-display text-white text-xl">{editingDevice.name}</p>
              <p className="text-white/40 text-xs font-body uppercase tracking-wider">{editingDevice.category}</p>
            </div>
            <button
              onClick={() => toggle(editingDevice)}
              className="flex-shrink-0"
              title={editingDevice.is_on ? 'Turn off' : 'Turn on'}
            >
              {editingDevice.is_on
                ? <ToggleRight className="w-9 h-9 text-lime" />
                : <ToggleLeft className="w-9 h-9 text-white/30" />}
            </button>
          </div>

          {/* Cost breakdown summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-black/30 rounded-lg p-3 border border-lime/10">
              <div className="flex items-center gap-1.5 mb-1"><Zap className="w-3 h-3 text-lime" /><p className="text-white/40 text-xs font-body">DAILY</p></div>
              <p className="font-display text-lime text-lg">{dailyKwh.toFixed(1)}</p>
              <p className="text-white/30 text-xs font-body">kWh · R{dailyCost.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3 border border-amber/20">
              <div className="flex items-center gap-1.5 mb-1"><Calendar className="w-3 h-3 text-amber" /><p className="text-white/40 text-xs font-body">MONTHLY</p></div>
              <p className="font-display text-amber text-lg">{monthlyKwh.toFixed(0)}</p>
              <p className="text-white/30 text-xs font-body">kWh · R{monthlyCost.toFixed(0)}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3 h-3 text-white/60" /><p className="text-white/40 text-xs font-body">YEARLY</p></div>
              <p className="font-display text-white text-lg">{yearlyCost.toFixed(0)}</p>
              <p className="text-white/30 text-xs font-body">R estimate</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3 h-3 text-white/60" /><p className="text-white/40 text-xs font-body">USAGE</p></div>
              <p className="font-display text-white text-lg">{editingDevice.kwh_per_hour}</p>
              <p className="text-white/30 text-xs font-body">kWh/hr · {editingDevice.daily_hours ?? 1}h/day</p>
            </div>
          </div>

          {/* Edit form */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <p className="font-display text-white/50 text-xs tracking-widest">EDIT DEVICE</p>

            {/* AI Device Finder */}
            <DeviceAISearch onApply={(d) => {
              setEditingDevice(prev => ({
                ...prev,
                kwh_per_hour: d.kwh_per_hour,
                daily_hours: d.daily_hours,
                category: d.category,
                icon: d.icon,
              }));
              saveEdit({
                kwh_per_hour: d.kwh_per_hour,
                daily_hours: d.daily_hours,
                category: d.category,
                icon: d.icon,
              });
            }} />

            <div>
              <label className="text-white/40 text-xs font-body block mb-1.5">Name</label>
              <input
                type="text"
                value={editingDevice.name}
                onChange={e => setEditingDevice({ ...editingDevice, name: e.target.value })}
                className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs font-body block mb-1.5">Icon</label>
              <DeviceIconPicker
                value={editingDevice.icon}
                onChange={(icon) => { setEditingDevice({ ...editingDevice, icon }); saveEdit({ icon }); }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/40 text-xs font-body block mb-1.5">kWh / hour</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingDevice.kwh_per_hour}
                  onChange={e => setEditingDevice({ ...editingDevice, kwh_per_hour: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs font-body block mb-1.5">Hours / day</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingDevice.daily_hours ?? 1}
                  onChange={e => setEditingDevice({ ...editingDevice, daily_hours: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs font-body block mb-1.5">Category</label>
              <select
                value={editingDevice.category}
                onChange={e => setEditingDevice({ ...editingDevice, category: e.target.value })}
                className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
              >
                <option value="heating">Heating</option>
                <option value="cooling">Cooling</option>
                <option value="lighting">Lighting</option>
                <option value="appliances">Appliances</option>
                <option value="kitchen">Kitchen</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              onClick={() => saveEdit({
                name: editingDevice.name,
                kwh_per_hour: editingDevice.kwh_per_hour,
                daily_hours: editingDevice.daily_hours,
                category: editingDevice.category,
              })}
              disabled={saving}
              className="w-full bg-lime text-black font-display text-sm py-2.5 rounded-lg hover:bg-lime/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>

            <button
              onClick={() => { removeDevice(editingDevice); setEditingDevice(null); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-display text-sm hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> DELETE DEVICE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN DEVICE LIST VIEW ──
  return (
    <div className="card-dark p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-lime" />
          <span className="font-display text-white/60 text-xs tracking-widest">DEVICE CONTROL</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sortByUsage}
            className={`flex items-center gap-1 text-xs font-display border rounded-lg px-2 py-1 transition-colors ${
              sortedMode ? 'bg-amber/20 border-amber/40 text-amber' : 'border-white/10 text-white/50 hover:text-amber hover:border-amber/30'
            }`}
            title="Sort biggest energy users to top"
          >
            <ArrowDownWideNarrow className="w-3 h-3" /> {sortedMode ? 'PRIORITY' : 'SORT'}
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1 text-xs font-display border rounded-lg px-2 py-1 transition-colors ${
              editMode ? 'bg-lime/20 border-lime/40 text-lime' : 'border-white/10 text-white/50 hover:text-lime hover:border-lime/30'
            }`}
          >
            <Pencil className="w-3 h-3" /> {editMode ? 'DONE' : 'EDIT'}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-lime text-xs font-display border border-lime/30 rounded-lg px-2 py-1 hover:bg-lime/10 transition-colors"
          >
            <Plus className="w-3 h-3" /> ADD
          </button>
        </div>
      </div>

      {/* Live load summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-lg p-3 border border-lime/10">
          <p className="text-white/40 text-xs font-body">ACTIVE LOAD</p>
          <p className="font-display text-lime text-2xl">{activeKwh.toFixed(2)}</p>
          <p className="text-white/30 text-xs font-body">kWh/hour</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <p className="text-white/40 text-xs font-body">IF ALL ON</p>
          <p className="font-display text-white/60 text-2xl">{totalKwh.toFixed(2)}</p>
          <p className="text-white/30 text-xs font-body">kWh/hour max</p>
        </div>
      </div>

      {/* Add device form */}
      {showAdd && (
        <div className="bg-black/40 border border-lime/20 rounded-xl p-4 space-y-3 animate-fade-in">
          <p className="font-display text-white/60 text-xs tracking-widest">NEW DEVICE</p>
          <DeviceAISearch onApply={(d) => {
            setNewName(d.name);
            setNewKwh(d.kwh_per_hour.toString());
            setNewHours((d.daily_hours || 1).toString());
            setNewCategory(d.category);
            setNewIcon(d.icon);
          }} />
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Device name"
            className="w-full bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
          />
          <DeviceIconPicker value={newIcon} onChange={setNewIcon} />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={newKwh}
              onChange={e => setNewKwh(e.target.value)}
              placeholder="kWh/hr"
              className="bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
            />
            <input
              type="number"
              step="0.5"
              value={newHours}
              onChange={e => setNewHours(e.target.value)}
              placeholder="Hrs/day"
              className="bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="bg-black/50 border border-card-border rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-lime transition-colors"
            >
              <option value="heating">Heating</option>
              <option value="cooling">Cooling</option>
              <option value="lighting">Lighting</option>
              <option value="appliances">Appliances</option>
              <option value="kitchen">Kitchen</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={addDevice}
            disabled={!newName || !newKwh || saving}
            className="w-full bg-lime text-black font-display text-sm py-2 rounded-lg hover:bg-lime/90 transition-all disabled:opacity-40"
          >
            {saving ? 'ADDING...' : 'ADD DEVICE'}
          </button>
        </div>
      )}

      {/* Device list */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="devices">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {devices.map((device, index) => (
                <Draggable key={device.id} draggableId={device.id} index={index} isDragDisabled={!editMode}>
                  {(dragProvided, snapshot) => (
                    <DeviceRow
                      innerRef={dragProvided.innerRef}
                      dragHandleProps={dragProvided.dragHandleProps}
                      device={device}
                      editMode={editMode}
                      ratePerKwh={ratePerKwh}
                      isDragging={snapshot.isDragging}
                      onToggle={toggle}
                      onEdit={setEditingDevice}
                      onRemove={removeDevice}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editMode && (
        <p className="text-white/30 text-xs font-body text-center">
          Drag the handle to reorder by priority. Tap pencil to edit or delete a device.
        </p>
      )}
    </div>
  );
}