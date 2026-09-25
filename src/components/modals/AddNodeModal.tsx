import React, { useState, useEffect } from 'react';
import { X, Layers3, Plus, Settings, AlertTriangle } from 'lucide-react';
import type { NodeType, NodeStatus, EquipmentDefinition } from '../../types/plant';

const PRESET_EQUIPMENT: EquipmentDefinition[] = [
  {
    name: 'Cement Mill',
    nodeType: 'standard',
    category: 'Grinding',
    description: 'Grinds clinker with gypsum and additives into fine cement.',
  },
  {
    name: 'Cement Silo',
    nodeType: 'storage',
    category: 'Storage',
    description: 'Stores finished product in dedicated bulk silos.',
  },
  {
    name: 'Rotary Packer',
    nodeType: 'standard',
    category: 'Packaging',
    description: 'Packs finished cement into bags or direct truck loading.',
  },
  {
    name: 'Coal Mill',
    nodeType: 'standard',
    category: 'Grinding',
    description: 'Dries and pulverizes solid fuel for burners.',
  },
  {
    name: 'Blast Furnace Tuyere',
    nodeType: 'input',
    category: 'Blast Air',
    description: 'Injects superheated air into the bottom of the furnace.',
  },
  {
    name: 'Flue Gas Scrubber',
    nodeType: 'standard',
    category: 'Environmental',
    description: 'Filters and neutralizes hot process exhaust gas.',
  },
  {
    name: 'Custom Equipment',
    nodeType: 'standard',
    category: 'General',
    description: 'Custom parallel process equipment unit.',
  },
];

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    type: NodeType;
    name: string;
    category: string;
    description: string;
    status: NodeStatus;
    isComposite?: boolean;
  }) => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>('standard');
  const [category, setCategory] = useState('Grinding');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<NodeStatus>('running');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      type,
      name,
      category,
      description,
      status,
      isComposite: type === 'composite',
    });
    setName('');
    setType('standard');
    setCategory('Grinding');
    setDescription('');
    setStatus('running');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Add Custom Process Node</span>
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Node Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NodeType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="standard">Standard Equipment</option>
              <option value="storage">Storage Silo</option>
              <option value="input">Side Feed Input</option>
              <option value="composite">Composite Process Container</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Equipment / Node Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Limestone Crusher, Raw Mill B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Process Category
            </label>
            <input
              type="text"
              placeholder="e.g. Grinding, Pyroprocessing, Homogenization"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              placeholder="Provide operation parameters, capacity limits, or purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Operation Status
            </label>
            <div className="flex gap-2">
              {(['running', 'idle', 'stopped'] as NodeStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-1.5 border rounded-lg font-semibold uppercase tracking-wider text-[10px] transition-all ${
                    status === st
                      ? st === 'running'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : st === 'idle'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                        : 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 font-semibold text-slate-500 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddParallelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (equipmentDef: EquipmentDefinition, count: number) => void;
}

export const AddParallelModal: React.FC<AddParallelModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [selectedEqIndex, setSelectedEqIndex] = useState(0);
  const [customName, setCustomName] = useState('Custom Unit');
  const [count, setCount] = useState(3);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPreset = PRESET_EQUIPMENT[selectedEqIndex] || PRESET_EQUIPMENT[0];
  const isCustom = currentPreset.name === 'Custom Equipment';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce 2 <= count <= 10
    if (count < 2 || count > 10) {
      setValidationError('Instance count must be between 2 and 10.');
      return;
    }

    setValidationError(null);

    const definitionToUse: EquipmentDefinition = {
      ...currentPreset,
      name: isCustom ? customName : currentPreset.name,
    };

    onAdd(definitionToUse, count);
    onClose();
  };

  const handleCountChange = (val: number) => {
    setCount(val);
    if (val < 2 || val > 10) {
      setValidationError('Instance count must be between 2 and 10.');
    } else {
      setValidationError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Layers3 className="w-4 h-4 text-indigo-600" />
            <span>Create Parallel Equipment</span>
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Equipment Type
            </label>
            <select
              value={selectedEqIndex}
              onChange={(e) => setSelectedEqIndex(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              {PRESET_EQUIPMENT.map((eq, idx) => (
                <option key={eq.name} value={idx}>
                  {eq.name} ({eq.nodeType} / {eq.category})
                </option>
              ))}
            </select>
          </div>

          {isCustom && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Custom Name
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Number of Instances (2 – 10)
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={count}
              onChange={(e) => handleCountChange(parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg text-slate-700 focus:outline-none font-bold text-sm ${
                validationError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'
              }`}
            />
          </div>

          {validationError && (
            <div className="flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 leading-normal flex items-start gap-2">
            <Settings className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span>
              This will create <b>{count}</b> parallel instances of type <b>{currentPreset.nodeType}</b> under category <b>{currentPreset.category}</b>.
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 font-semibold text-slate-500 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(validationError)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              Create Instances
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
