import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Sparkles, 
  Undo2, 
  Redo2, 
  Plus, 
  Layers3, 
  Link
} from 'lucide-react';

interface GraphToolbarProps {
  onAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAddNode: () => void;
  onAddParallel: () => void;
  onAddConnection: () => void;
  isConnectingMode: boolean;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  onAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAddNode,
  onAddParallel,
  onAddConnection,
  isConnectingMode,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-1 p-1.5 bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl">
      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
        <button
          onClick={() => zoomIn()}
          title="Zoom In"
          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomOut()}
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => fitView({ duration: 800 })}
          title="Fit View"
          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg transition-all"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Auto Layout */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
        <button
          onClick={onAutoLayout}
          title="Auto Layout Graph"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-all border border-indigo-100"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto Layout</span>
        </button>
      </div>

      {/* History Controls */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={`p-1.5 rounded-lg transition-all ${
            canUndo 
              ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-800' 
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={`p-1.5 rounded-lg transition-all ${
            canRedo 
              ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-800' 
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Actions */}
      <div className="flex items-center gap-1 pl-1.5">
        <button
          onClick={onAddNode}
          title="Add Node"
          className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Node</span>
        </button>
        <button
          onClick={onAddParallel}
          title="Add Parallel Equipment"
          className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-all"
        >
          <Layers3 className="w-3.5 h-3.5" />
          <span>Parallel Eq.</span>
        </button>
        <button
          onClick={onAddConnection}
          title="Toggle Connection Guide Mode"
          className={`flex items-center gap-1 px-2.5 py-1.5 font-semibold text-xs rounded-lg transition-all border ${
            isConnectingMode
              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              : 'hover:bg-slate-100 text-slate-700 border-transparent'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>{isConnectingMode ? 'Connecting Mode...' : 'Add Link'}</span>
        </button>
      </div>
    </div>
  );
};
