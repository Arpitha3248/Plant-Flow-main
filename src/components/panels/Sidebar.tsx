import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sliders, 
  Info,
  Database,
  HardHat,
  Settings,
  Layers,
  Flame,
  Droplet,
  Wind,
  Box,
  Activity
} from 'lucide-react';
import type { NodeType, NodeStatus } from '../../types/plant';

interface SidebarItem {
  type: NodeType;
  name: string;
  category: string;
  description: string;
}

const getSidebarCategoryIcon = (category: string, type: NodeType) => {
  const cat = category.toLowerCase();
  if (type === 'storage') return <Database className="w-4 h-4" />;
  if (cat.includes('mines') || cat.includes('raw')) return <HardHat className="w-4 h-4" />;
  if (cat.includes('crush') || cat.includes('grind') || cat.includes('mill')) return <Settings className="w-4 h-4" />;
  if (cat.includes('homo') || cat.includes('stack')) return <Layers className="w-4 h-4" />;
  if (cat.includes('pyro') || cat.includes('kiln') || cat.includes('thermal')) return <Flame className="w-4 h-4" />;
  if (cat.includes('fuel')) return <Flame className="w-4 h-4 text-orange-500" />;
  if (cat.includes('gas') || cat.includes('oil')) return <Droplet className="w-4 h-4 text-orange-500" />;
  if (cat.includes('air') || cat.includes('fan')) return <Wind className="w-4 h-4 text-sky-500" />;
  if (cat.includes('pack') || cat.includes('loader')) return <Box className="w-4 h-4" />;
  
  return <Activity className="w-4 h-4" />;
};

const SIDEBAR_ITEMS: { section: string; items: SidebarItem[] }[] = [
  {
    section: 'Process Equipment',
    items: [
      { type: 'standard', name: 'Crusher', category: 'Crushing', description: 'Reduces raw mineral blocks down to small rock sizes.' },
      { type: 'standard', name: 'Stacker & Reclaimer', category: 'Homogenization', description: 'Mixes and stores raw materials in longitudinal stockpiles.' },
      { type: 'standard', name: 'Raw Mill', category: 'Grinding', description: 'Grinds raw mix into ultra-fine raw meal powder.' },
      { type: 'standard', name: 'Cyclone Pre-heater', category: 'Preheating', description: 'Pre-heats feed using warm kiln exhaust gases.' },
      { type: 'composite', name: 'Rotary Kiln System', category: 'Pyroprocessing', description: 'Extreme heat pyroprocessing unit (Composite).' },
      { type: 'standard', name: 'Cement Mill', category: 'Grinding', description: 'Grinds clinker and gypsum to produce cement.' },
      { type: 'standard', name: 'Rotary Packer', category: 'Packaging', description: 'Automated bag filling and loading machine.' },
    ],
  },
  {
    section: 'Storage Silos',
    items: [
      { type: 'storage', name: 'Blending Silo', category: 'Storage', description: 'Homogenizes raw meal before feeding it to the pre-heater.' },
      { type: 'storage', name: 'Clinker Silo', category: 'Storage', description: 'Stores hot clinker output before final grinding.' },
      { type: 'storage', name: 'Cement Silo', category: 'Storage', description: 'Holds OPC, PPC, or specialized finished cement types.' },
    ],
  },
  {
    section: 'Side Inputs',
    items: [
      { type: 'input', name: 'Coal Supply', category: 'Fuel Source', description: 'Solid fuel supply line for high heat combustion.' },
      { type: 'input', name: 'Natural Gas / Oil', category: 'Alternative Fuel', description: 'Gas/oil flow line for auxiliary burning.' },
      { type: 'input', name: 'Combustion Air Intake', category: 'Oxidizer', description: 'Supplies high-velocity forced draft air.' },
      { type: 'input', name: 'Alternative Raw Material', category: 'Additives', description: 'Alternative fly ash, gypsum, slag, or waste material inputs.' },
    ],
  },
  {
    section: 'Composite Elements',
    items: [
      { type: 'composite', name: 'Composite Process', category: 'Subprocess', description: 'Custom nested process containing its own internal graph.' },
    ],
  },
];

interface SidebarProps {
  onAddNode: (item: Omit<SidebarItem, 'description'> & { description: string; status: NodeStatus; isComposite?: boolean }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Drag Start Event (HTML5 DnD)
  const onDragStart = (event: React.DragEvent, item: SidebarItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleItemClick = (item: SidebarItem) => {
    onAddNode({
      type: item.type,
      name: item.name,
      category: item.category,
      description: item.description,
      status: 'running',
      isComposite: item.type === 'composite',
    });
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full select-none">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-2">
        <h2 className="text-slate-800 font-extrabold text-sm tracking-wide uppercase flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Equipment Library</span>
        </h2>
        <p className="text-[11px] text-slate-400">
          Drag equipment to canvas or click (+) to add instantly.
        </p>
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Accordion / List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {SIDEBAR_ITEMS.map((section) => {
          const filteredItems = section.items.filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={section.section} className="space-y-1.5">
              <h3 className="text-slate-400 font-bold text-[10px] tracking-wider uppercase pl-1">
                {section.section}
              </h3>
              
              <div className="space-y-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.name}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    className="group flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-lg cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div className="flex items-start gap-2.5 pr-2">
                      <div className="p-1.5 bg-white group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 rounded text-slate-600 group-hover:text-indigo-600 transition-colors shadow-sm">
                        {getSidebarCategoryIcon(item.category, item.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleItemClick(item)}
                      title={`Add ${item.name} to canvas`}
                      className="p-1 bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 rounded text-slate-500 hover:text-white transition-all shadow-sm opacity-60 group-hover:opacity-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {SIDEBAR_ITEMS.every(
          (section) =>
            section.items.filter(
              (item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0
        ) && (
          <div className="text-center py-8 text-slate-400 text-xs">
            No equipment matches search
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-500">Connecting Nodes:</span> Drag links between node handles. Use Delete or Backspace key to remove equipment or links.
        </div>
      </div>
    </div>
  );
};
