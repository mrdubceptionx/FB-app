import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Archive, 
  FileText, 
  Printer, 
  CheckSquare, 
  Layers, 
  Settings, 
  Sparkles,
  CheckCircle,
  Clock,
  Calendar,
  Zap,
  HelpCircle,
  Scissors
} from 'lucide-react';
import { ConversationThread, ExportOptions } from '../types';
import { 
  generateMasterCombinedExport, 
  createBatchExportZip, 
  downloadFile,
  generateThreadMarkdown,
  estimateTokensAndWords,
  formatDateKey
} from '../utils/exporter';
import { XPProgressBar } from './XPProgressBar';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ConversationThread[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  threads,
}) => {
  const selectedThreads = threads.filter(t => t.selected);
  const totalSelectedMessages = selectedThreads.reduce((sum, t) => sum + t.totalMessages, 0);

  const [options, setOptions] = useState<ExportOptions>({
    format: 'markdown',
    bundleMode: 'individual_zip',
    timeChunking: 'yearly', // Default to yearly for optimal NotebookLM retrieval
    sortOrder: 'asc',
    groupByDay: true,
    includeReactions: true,
    includeMediaPlaceholders: true,
    includePartDividers: true,
    optimizeForNotebookLM: true,
    mergeConsecutiveMessages: true, // Default to true for token efficiency
    includePromptStarters: true,
    timestampFormat: '24h',
    dateFilterStart: '',
    dateFilterEnd: '',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [lastExportedFilename, setLastExportedFilename] = useState('');

  // Sample token estimation across selected threads
  const tokenStats = useMemo(() => {
    if (selectedThreads.length === 0) return { words: 0, tokens: 0, charCount: 0 };
    // Sample first thread to estimate
    const samplePreview = generateThreadMarkdown(selectedThreads[0], options);
    const sampleStats = estimateTokensAndWords(samplePreview);
    
    // Scale proportionally to total selected messages
    const multiplier = selectedThreads[0].totalMessages > 0
      ? totalSelectedMessages / selectedThreads[0].totalMessages
      : 1;

    return {
      words: Math.round(sampleStats.words * multiplier),
      tokens: Math.round(sampleStats.tokens * multiplier),
      charCount: Math.round(sampleStats.charCount * multiplier),
    };
  }, [selectedThreads, options, totalSelectedMessages]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (selectedThreads.length === 0) return;
    setIsExporting(true);
    setExportComplete(false);
    setZipProgress(0);

    try {
      if (options.bundleMode === 'individual_zip') {
        const zipBlob = await createBatchExportZip(threads, options, (pct) => {
          setZipProgress(pct);
        });
        const chunkSuffix = options.timeChunking !== 'none' ? `_${options.timeChunking}` : '';
        const filename = `messenger_export${chunkSuffix}_${new Date().toISOString().slice(0, 10)}.zip`;
        downloadFile(zipBlob, filename, 'application/zip');
        setLastExportedFilename(filename);
      } else {
        // Single master file
        const content = generateMasterCombinedExport(threads, options);
        const ext = options.format === 'markdown' ? 'md' : 'html';
        const mime = options.format === 'markdown' ? 'text/markdown' : 'text/html';
        const filename = `master_messenger_archive_${new Date().toISOString().slice(0, 10)}.${ext}`;
        downloadFile(content, filename, mime);
        setLastExportedFilename(filename);
      }

      setExportComplete(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please check browser console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4 backdrop-blur-xs">
      <div className="xp-window w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Title Bar */}
        <div className="xp-titlebar xp-titlebar-active flex items-center justify-between select-none">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Download className="w-4 h-4 text-white" />
            <span>Export Suite & NotebookLM Prepper — {selectedThreads.length} Selected</span>
          </div>
          <button
            onClick={onClose}
            className="xp-btn-ctrl xp-btn-close text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 bg-[#ece9d8] space-y-3 text-[11px] overflow-y-auto flex-1">
          {/* Summary & Token Estimator Box */}
          <div className="xp-inset p-2.5 bg-[#faf9f5]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-gray-800">
              <span className="font-bold text-[12px] text-[#003399]">
                Scope & LLM Context Estimate:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded border border-blue-300 font-bold">
                  {selectedThreads.length} Threads • {totalSelectedMessages.toLocaleString()} msgs
                </span>
                <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                  ~{tokenStats.words.toLocaleString()} words
                </span>
                <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded border border-purple-300 font-bold">
                  ~{tokenStats.tokens.toLocaleString()} tokens
                </span>
              </div>
            </div>

            <div className="mt-1.5 text-[10px] text-gray-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600 flex-shrink-0" />
              <span>
                NotebookLM supports up to <strong>500,000 words</strong> per source file. Splitting by years ensures optimal retrieval precision.
              </span>
            </div>

            {selectedThreads.length === 0 && (
              <div className="text-red-600 mt-1 font-semibold">
                ⚠️ No threads currently selected. Please check at least one conversation in the table.
              </div>
            )}
          </div>

          {/* Section 1: Time-Based Chunking (NotebookLM Sizing) */}
          <fieldset className="xp-groove p-2.5 bg-[#ece9d8]">
            <legend className="px-1 text-[11px] font-bold text-gray-800 flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-[#0055ea]" />
              <span>1. Time-Based Chunking (NotebookLM Source Sizing)</span>
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
              <label
                className={`xp-inset p-2 flex flex-col cursor-pointer transition-colors ${
                  options.timeChunking === 'yearly' ? 'bg-[#e7f0ff] border-blue-500 font-bold' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="timeChunking"
                    value="yearly"
                    checked={options.timeChunking === 'yearly'}
                    onChange={() => setOptions(prev => ({ ...prev, timeChunking: 'yearly' }))}
                  />
                  <span className="text-gray-900">📅 Yearly Slices</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 font-normal">
                  <code className="bg-gray-100 px-0.5">_2021.md</code>, <code className="bg-gray-100 px-0.5">_2022.md</code> (Recommended)
                </div>
              </label>

              <label
                className={`xp-inset p-2 flex flex-col cursor-pointer transition-colors ${
                  options.timeChunking === 'quarterly' ? 'bg-[#e7f0ff] border-blue-500 font-bold' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="timeChunking"
                    value="quarterly"
                    checked={options.timeChunking === 'quarterly'}
                    onChange={() => setOptions(prev => ({ ...prev, timeChunking: 'quarterly' }))}
                  />
                  <span className="text-gray-900">🗓️ Quarterly</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 font-normal">
                  <code className="bg-gray-100 px-0.5">_2021_Q1.md</code> (For very dense chats)
                </div>
              </label>

              <label
                className={`xp-inset p-2 flex flex-col cursor-pointer transition-colors ${
                  options.timeChunking === 'monthly' ? 'bg-[#e7f0ff] border-blue-500 font-bold' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="timeChunking"
                    value="monthly"
                    checked={options.timeChunking === 'monthly'}
                    onChange={() => setOptions(prev => ({ ...prev, timeChunking: 'monthly' }))}
                  />
                  <span className="text-gray-900">📆 Monthly</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 font-normal">
                  <code className="bg-gray-100 px-0.5">_2021_04.md</code>
                </div>
              </label>

              <label
                className={`xp-inset p-2 flex flex-col cursor-pointer transition-colors ${
                  options.timeChunking === 'none' ? 'bg-[#e7f0ff] border-blue-500 font-bold' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="timeChunking"
                    value="none"
                    checked={options.timeChunking === 'none'}
                    onChange={() => setOptions(prev => ({ ...prev, timeChunking: 'none' }))}
                  />
                  <span className="text-gray-900">📁 Single Full File</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 font-normal">
                  All dates in 1 file
                </div>
              </label>
            </div>
          </fieldset>

          {/* Section 2: Granular Date Range Filter */}
          <fieldset className="xp-groove p-2.5 bg-[#ece9d8]">
            <legend className="px-1 text-[11px] font-bold text-gray-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0055ea]" />
              <span>2. Granular Date Range Filter (Optional)</span>
            </legend>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">From Date:</span>
                <input
                  type="date"
                  value={options.dateFilterStart || ''}
                  onChange={e => setOptions(prev => ({ ...prev, dateFilterStart: e.target.value }))}
                  className="xp-inset-bevel px-1.5 py-0.5 text-[11px] bg-white font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">To Date:</span>
                <input
                  type="date"
                  value={options.dateFilterEnd || ''}
                  onChange={e => setOptions(prev => ({ ...prev, dateFilterEnd: e.target.value }))}
                  className="xp-inset-bevel px-1.5 py-0.5 text-[11px] bg-white font-mono"
                />
              </div>

              {(options.dateFilterStart || options.dateFilterEnd) && (
                <button
                  onClick={() => setOptions(prev => ({ ...prev, dateFilterStart: '', dateFilterEnd: '' }))}
                  className="xp-button py-0.5 px-2 text-[10px] text-red-700"
                >
                  Clear Date Filter
                </button>
              )}
            </div>
          </fieldset>

          {/* Section 3: Document Format & Packaging */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Document Format */}
            <fieldset className="xp-groove p-2.5 bg-[#ece9d8]">
              <legend className="px-1 text-[11px] font-bold text-gray-800">
                3. Document Format
              </legend>
              <div className="space-y-1.5 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="markdown"
                    checked={options.format === 'markdown'}
                    onChange={() => setOptions(prev => ({ ...prev, format: 'markdown' }))}
                  />
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#0055ea]" />
                    <span className="font-semibold text-gray-900">Markdown (.md)</span>
                    <span className="text-[10px] text-gray-500">(NotebookLM & LLMs)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="html"
                    checked={options.format === 'html'}
                    onChange={() => setOptions(prev => ({ ...prev, format: 'html' }))}
                  />
                  <div className="flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5 text-[#006600]" />
                    <span className="font-semibold text-gray-900">Standalone HTML / PDF</span>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Packaging */}
            <fieldset className="xp-groove p-2.5 bg-[#ece9d8]">
              <legend className="px-1 text-[11px] font-bold text-gray-800">
                4. Packaging
              </legend>
              <div className="space-y-1.5 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bundleMode"
                    value="individual_zip"
                    checked={options.bundleMode === 'individual_zip'}
                    onChange={() => setOptions(prev => ({ ...prev, bundleMode: 'individual_zip' }))}
                  />
                  <div className="flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5 text-[#9933cc]" />
                    <span className="font-semibold text-gray-900">ZIP Archive (Batch Files)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bundleMode"
                    value="single_combined"
                    checked={options.bundleMode === 'single_combined'}
                    onChange={() => setOptions(prev => ({ ...prev, bundleMode: 'single_combined' }))}
                  />
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#0055ea]" />
                    <span className="font-semibold text-gray-900">Single Master File with TOC</span>
                  </div>
                </label>
              </div>
            </fieldset>
          </div>

          {/* Section 4: LLM Optimizations & Formatting */}
          <fieldset className="xp-groove p-2.5 bg-[#ece9d8]">
            <legend className="px-1 text-[11px] font-bold text-gray-800 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>5. LLM Token Optimizations & Transcripts</span>
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-4 mt-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#003399]">
                <input
                  type="checkbox"
                  checked={options.mergeConsecutiveMessages}
                  onChange={e => setOptions(prev => ({ ...prev, mergeConsecutiveMessages: e.target.checked }))}
                />
                <span>Merge consecutive rapid messages (Saves ~35% tokens)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includePromptStarters}
                  onChange={e => setOptions(prev => ({ ...prev, includePromptStarters: e.target.checked }))}
                />
                <span>Include NotebookLM Prompt Starters Guide</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.groupByDay}
                  onChange={e => setOptions(prev => ({ ...prev, groupByDay: e.target.checked }))}
                />
                <span>Group by Day (## 📅 YYYY-MM-DD)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.optimizeForNotebookLM}
                  onChange={e => setOptions(prev => ({ ...prev, optimizeForNotebookLM: e.target.checked }))}
                />
                <span>Add YAML / Metadata Headers</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeReactions}
                  onChange={e => setOptions(prev => ({ ...prev, includeReactions: e.target.checked }))}
                />
                <span>Include Emoji Reactions</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeMediaPlaceholders}
                  onChange={e => setOptions(prev => ({ ...prev, includeMediaPlaceholders: e.target.checked }))}
                />
                <span>Include Photo/Audio Placeholders</span>
              </label>
            </div>
          </fieldset>

          {/* Progress / Status During Export */}
          {isExporting && (
            <div className="p-2.5 xp-inset bg-white">
              <XPProgressBar
                percentage={zipProgress || 50}
                label="Building NotebookLM Export Packages..."
                statusText={
                  options.bundleMode === 'individual_zip'
                    ? `Slicing into ${options.timeChunking} files and compressing ZIP...`
                    : `Generating master combined file...`
                }
              />
            </div>
          )}

          {exportComplete && (
            <div className="p-2.5 xp-inset bg-green-50 border border-green-300 text-green-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-bold">Export Complete & Downloaded!</div>
                <div className="text-[10px] font-mono">{lastExportedFilename}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#ece9d8] border-t border-[#aca899] px-4 py-2.5 flex items-center justify-between select-none">
          <button
            onClick={onClose}
            className="xp-button py-1 px-4"
          >
            Cancel
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting || selectedThreads.length === 0}
            className="xp-button xp-button-primary py-1.5 px-5 flex items-center gap-1.5 text-[#003399]"
          >
            <Download className="w-4 h-4" />
            <span className="font-bold">
              {isExporting ? 'Exporting...' : `Export ${selectedThreads.length} Conversations Now`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

