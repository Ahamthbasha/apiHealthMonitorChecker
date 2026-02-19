// components/dashboard/EmptyState.tsx
import React from 'react';
import { Activity, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddNew }) => (
  <div className="h-full flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="relative mb-6 inline-block">
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8 text-gray-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
          <span className="text-gray-400 text-xs">?</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">No Monitor Selected</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        Select a monitor from the sidebar to view its status, or create a new one to get started.
      </p>
      <button
        onClick={onAddNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-green-900/20"
      >
        <Plus className="w-4 h-4" />
        Add New Monitor
      </button>
    </div>
  </div>
);

export default EmptyState;