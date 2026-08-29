import React from 'react';
import { 
  FolderOpen, 
  FileCode, 
  Archive, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Download, 
  Trash2, 
  HelpCircle,
  Eye
} from 'lucide-react';

interface XPToolbarProps {
  onOpenFolder: () => void;
  onOpenFiles: () => void;
  onOpenZip: () => void;
  onLoadSample: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenExport: () => void;
  onOpenFeatures: () => void;
  onClearAll: () => void;
  onOpenHelp: () => void;
  selectedCount: number;
  totalThreads: number;
  isProcessing: boolean;
}

export const XPToolbar: React.FC<XPToolbarProps> = ({
  onOpenFolder,
  onOpenFiles,
  onOpenZip,
  onLoadSample,
  onSelectAll,
  onDeselectAll,
  onOpenExport,
  onOpenFeatures,
  onClearAll,
  onOpenHelp,
  selectedCount,
  totalThreads,
  isProcessing,
}) => {
  return (
    <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-1 flex flex-wrap items-center gap-1 text-[11px] shadow-sm select-none">
      {/* File Ingestion Group */}
      <div className="flex items-center gap-1 pr-2 border-r border-[#aca899]">
        <button
          id="btn-upload-folder"
          onClick={onOpenFolder}
          disabled={isProcessing}
          className="xp-button flex items-center gap-1.5 py-1 px-2.5"
          title="Upload an entire Messenger export folder (webkitdirectory)"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#d48800]" />
          <span>Add Folder...</span>
        </button>

        <button
          id="btn-upload-files"
          onClick={onOpenFiles}
          disabled={isProcessing}
          className="xp-button flex items-center gap-1.5 py-1 px-2.5"
          title="Upload multiple .html files"
        >
          <FileCode className="w-3.5 h-3.5 text-[#0055ea]" />
          <span>Add HTML Files...</span>
        </button>

        <button
          id="btn-upload-zip"
          onClick={onOpenZip}
          disabled={isProcessing}
          className="xp-button flex items-center gap-1.5 py-1 px-2.5"
          title="Extract and process directly from Facebook export .ZIP"
        >
          <Archive className="w-3.5 h-3.5 text-[#9933cc]" />
          <span>Upload ZIP Archive...</span>
        </button>

        <button
          id="btn-load-sample"
          onClick={onLoadSample}
          disabled={isProcessing}
          className="xp-button xp-button-primary flex items-center gap-1.5 py-1 px-2.5 text-[#003399]"
          title="Load preloaded sample multi-part conversations"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#e6a100]" />
          <span>Load Sample Dataset</span>
        </button>
      </div>

      {/* Selection Actions */}
      <div className="flex items-center gap-1 pr-2 border-r border-[#aca899]">
        <button
          id="btn-select-all"
          onClick={onSelectAll}
          disabled={isProcessing || totalThreads === 0}
          className="xp-button flex items-center gap-1 py-1 px-2"
          title="Select all conversations"
        >
          <CheckSquare className="w-3 h-3 text-[#008800]" />
          <span>Select All</span>
        </button>

        <button
          id="btn-deselect-all"
          onClick={onDeselectAll}
          disabled={isProcessing || totalThreads === 0}
          className="xp-button flex items-center gap-1 py-1 px-2"
          title="Deselect all conversations"
        >
          <Square className="w-3 h-3 text-[#666666]" />
          <span>Deselect All</span>
        </button>
      </div>

      {/* Export Action */}
      <div className="flex items-center gap-1 pr-2 border-r border-[#aca899]">
        <button
          id="btn-open-export"
          onClick={onOpenExport}
          disabled={isProcessing || selectedCount === 0}
          className="xp-button xp-button-primary flex items-center gap-1.5 py-1 px-3 bg-[#e3f2fd]"
          title="Export selected threads to Markdown or PDF/HTML"
        >
          <Download className="w-3.5 h-3.5 text-[#0055ea]" />
          <span className="font-bold">Export Selected ({selectedCount})</span>
        </button>

        <button
          id="btn-open-features"
          onClick={onOpenFeatures}
          className="xp-button flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 text-amber-900 border-amber-400"
          title="Explore all implemented & proposed features with interactive filters"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-semibold">Feature Catalog</span>
        </button>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          id="btn-clear-all"
          onClick={onClearAll}
          disabled={isProcessing || totalThreads === 0}
          className="xp-button xp-button-danger flex items-center gap-1 py-1 px-2 text-[#990000]"
          title="Clear all loaded files"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear All</span>
        </button>

        <button
          id="btn-open-help"
          onClick={onOpenHelp}
          className="xp-button flex items-center gap-1 py-1 px-2"
          title="How to use & Format info"
        >
          <HelpCircle className="w-3 h-3 text-[#0055ea]" />
          <span>Help</span>
        </button>
      </div>
    </div>
  );
};
