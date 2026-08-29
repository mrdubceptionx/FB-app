import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FileCode, 
  Archive, 
  Sparkles, 
  Download, 
  HelpCircle, 
  Layers, 
  CheckCircle,
  MessageSquare,
  ShieldCheck,
  Minimize2,
  Square,
  X
} from 'lucide-react';
import { 
  RawFile, 
  ConversationThread, 
  ParsingProgress, 
  ExportOptions 
} from './types';
import { processAndGroupFiles } from './utils/threadGrouper';
import { readZipFile } from './utils/zipReader';
import { SAMPLE_FILES } from './data/sampleDataset';
import { generateThreadMarkdown, downloadFile } from './utils/exporter';
import { XPToolbar } from './components/XPToolbar';
import { FileUploadPanel } from './components/FileUploadPanel';
import { ThreadManagerTable } from './components/ThreadManagerTable';
import { ThreadDetailViewer } from './components/ThreadDetailViewer';
import { ExportDialog } from './components/ExportDialog';
import { HelpDialog } from './components/HelpDialog';
import { FeaturesExplorerDialog } from './components/FeaturesExplorerDialog';

export default function App() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [totalRawFilesCount, setTotalRawFilesCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ParsingProgress>({
    status: 'idle',
    currentFile: '',
    processedCount: 0,
    totalCount: 0,
    percentage: 0,
    detailMessage: 'Ready to process Messenger HTML archives.',
  });

  // Active dialogs
  const [inspectingThread, setInspectingThread] = useState<ConversationThread | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState<boolean>(false);

  // Auto-load sample data on first visit so user sees the interface alive immediately
  useEffect(() => {
    handleLoadSampleDataset();
  }, []);

  // Handle files selected via file dialog or drag & drop
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    const filesArray = Array.from(fileList);
    
    // Check if single zip was passed
    if (filesArray.length === 1 && filesArray[0].name.toLowerCase().endsWith('.zip')) {
      await handleZipSelected(filesArray[0]);
      return;
    }

    // Filter HTML files
    const htmlFiles = filesArray.filter(f => /\.(html|htm)$/i.test(f.name));
    if (htmlFiles.length === 0) {
      alert('No .html or .htm files found in selection.');
      setIsProcessing(false);
      return;
    }

    try {
      setProgress({
        status: 'parsing_files',
        currentFile: '',
        processedCount: 0,
        totalCount: htmlFiles.length,
        percentage: 0,
        detailMessage: `Reading ${htmlFiles.length} HTML files...`,
      });

      const rawFiles: RawFile[] = [];
      for (let i = 0; i < htmlFiles.length; i++) {
        const file = htmlFiles[i];
        const content = await file.text();
        // Use webkitRelativePath if available, otherwise file.name
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        
        rawFiles.push({
          name: file.name,
          path: relativePath,
          content,
          size: file.size,
          lastModified: file.lastModified,
        });

        if (i % 20 === 0) {
          setProgress(prev => ({
            ...prev,
            processedCount: i,
            percentage: Math.round((i / htmlFiles.length) * 50),
            detailMessage: `Read ${i} of ${htmlFiles.length} files from disk...`,
          }));
          await new Promise(r => setTimeout(r, 0));
        }
      }

      setTotalRawFilesCount(rawFiles.length);

      // Group and parse files
      const groupedThreads = await processAndGroupFiles(rawFiles, p => {
        setProgress(p);
      });

      setThreads(groupedThreads);
    } catch (err) {
      console.error('File parsing error:', err);
      alert('Error parsing files. See console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle direct ZIP upload
  const handleZipSelected = async (zipFile: File) => {
    setIsProcessing(true);
    try {
      const rawFiles = await readZipFile(zipFile, p => {
        setProgress(p);
      });

      setTotalRawFilesCount(rawFiles.length);

      const groupedThreads = await processAndGroupFiles(rawFiles, p => {
        setProgress(p);
      });

      setThreads(groupedThreads);
    } catch (err: unknown) {
      console.error('ZIP read error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`ZIP Archive error: ${msg}`);
      setProgress({
        status: 'error',
        currentFile: '',
        processedCount: 0,
        totalCount: 0,
        percentage: 0,
        detailMessage: `Error: ${msg}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load built-in sample dataset
  const handleLoadSampleDataset = async () => {
    setIsProcessing(true);
    try {
      setTotalRawFilesCount(SAMPLE_FILES.length);
      const groupedThreads = await processAndGroupFiles(SAMPLE_FILES, p => {
        setProgress(p);
      });
      setThreads(groupedThreads);
    } catch (err) {
      console.error('Sample loading error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Thread selection handlers
  const handleToggleThreadSelect = (threadId: string) => {
    setThreads(prev =>
      prev.map(t => {
        if (t.id !== threadId) return t;
        const newSelected = !t.selected;
        return {
          ...t,
          selected: newSelected,
          parts: t.parts.map(p => ({ ...p, selected: newSelected })),
        };
      })
    );
  };

  // Sub-part selection handler
  const handleTogglePartSelect = (threadId: string, partId: string) => {
    setThreads(prev =>
      prev.map(t => {
        if (t.id !== threadId) return t;
        const updatedParts = t.parts.map(p => (p.id === partId ? { ...p, selected: !p.selected } : p));
        const hasSelectedParts = updatedParts.some(p => p.selected);
        return {
          ...t,
          selected: hasSelectedParts,
          parts: updatedParts,
        };
      })
    );

    // Update inspectingThread state if open
    if (inspectingThread && inspectingThread.id === threadId) {
      setInspectingThread(prev => {
        if (!prev) return null;
        const updatedParts = prev.parts.map(p => (p.id === partId ? { ...p, selected: !p.selected } : p));
        return {
          ...prev,
          parts: updatedParts,
        };
      });
    }
  };

  const handleSelectAll = () => {
    setThreads(prev =>
      prev.map(t => ({
        ...t,
        selected: true,
        parts: t.parts.map(p => ({ ...p, selected: true })),
      }))
    );
  };

  const handleDeselectAll = () => {
    setThreads(prev =>
      prev.map(t => ({
        ...t,
        selected: false,
        parts: t.parts.map(p => ({ ...p, selected: false })),
      }))
    );
  };

  const handleClearAll = () => {
    if (threads.length > 0 && !confirm('Are you sure you want to clear all loaded conversations?')) {
      return;
    }
    setThreads([]);
    setTotalRawFilesCount(0);
    setProgress({
      status: 'idle',
      currentFile: '',
      processedCount: 0,
      totalCount: 0,
      percentage: 0,
      detailMessage: 'Ready to process Messenger HTML archives.',
    });
  };

  const handleQuickExportThread = (thread: ConversationThread) => {
    const md = generateThreadMarkdown(thread, {
      sortOrder: 'asc',
      groupByDay: true,
      includeReactions: true,
      includeMediaPlaceholders: true,
      optimizeForNotebookLM: true,
      timestampFormat: '24h',
    });
    const filename = `${thread.baseId || 'conversation'}_archive.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const selectedCount = threads.filter(t => t.selected).length;
  const totalMessagesCount = threads.reduce((sum, t) => sum + t.totalMessages, 0);
  const selectedMessagesCount = threads
    .filter(t => t.selected)
    .reduce((sum, t) => sum + t.totalMessages, 0);

  return (
    <div className="min-h-screen p-2 md:p-6 flex flex-col justify-center items-center select-text">
      {/* Windows XP Window Frame */}
      <div className="xp-window w-full max-w-6xl min-h-[680px] flex flex-col shadow-2xl overflow-hidden">
        {/* Window Title Bar */}
        <div className="xp-titlebar xp-titlebar-active flex items-center justify-between select-none">
          <div className="flex items-center gap-2 font-bold text-xs">
            <MessageSquare className="w-4 h-4 text-white fill-blue-300" />
            <span>Messenger HTML Multi-Part Combiner & Exporter — [Windows XP Luna]</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="xp-btn-ctrl xp-btn-min" title="Minimize">
              _
            </button>
            <button className="xp-btn-ctrl xp-btn-max" title="Maximize">
              □
            </button>
            <button
              onClick={() => alert('Messenger Multi-Part Combiner is ready for offline batch archiving.')}
              className="xp-btn-ctrl xp-btn-close text-xs"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Windows XP Menu Bar */}
        <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-0.5 flex items-center gap-3 text-[11px] select-none text-gray-800">
          <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded-xs cursor-pointer">
            <u>F</u>ile
          </span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded-xs cursor-pointer">
            <u>E</u>dit
          </span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded-xs cursor-pointer">
            <u>V</u>iew
          </span>
          <span
            onClick={() => setShowExportModal(true)}
            className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded-xs cursor-pointer"
          >
            <u>E</u>xport
          </span>
          <span
            onClick={() => setShowFeaturesModal(true)}
            className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded-xs cursor-pointer font-semibold text-[#003399]"
          >
            <u>F</u>eatures Catalog & LLM Roadmap
          </span>
          <span
            onClick={() => setShowHelpModal(true)}
            className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded-xs cursor-pointer"
          >
            <u>H</u>elp
          </span>
        </div>

        {/* Windows XP Standard Buttons Toolbar */}
        <XPToolbar
          onOpenFolder={() => document.getElementById('folder-input')?.click()}
          onOpenFiles={() => document.getElementById('files-input')?.click()}
          onOpenZip={() => document.getElementById('zip-input')?.click()}
          onLoadSample={handleLoadSampleDataset}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onOpenExport={() => setShowExportModal(true)}
          onOpenFeatures={() => setShowFeaturesModal(true)}
          onClearAll={handleClearAll}
          onOpenHelp={() => setShowHelpModal(true)}
          selectedCount={selectedCount}
          totalThreads={threads.length}
          isProcessing={isProcessing}
        />

        {/* Ingestion & Upload Zone */}
        <FileUploadPanel
          onFilesSelected={handleFilesSelected}
          onZipSelected={handleZipSelected}
          onLoadSample={handleLoadSampleDataset}
          progress={progress}
          isProcessing={isProcessing}
          totalLoadedFiles={totalRawFilesCount}
          totalThreads={threads.length}
        />

        {/* Thread Management Table View */}
        <div className="flex-1 flex flex-col min-h-[380px]">
          <ThreadManagerTable
            threads={threads}
            onToggleThreadSelect={handleToggleThreadSelect}
            onTogglePartSelect={handleTogglePartSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onInspectThread={thread => setInspectingThread(thread)}
            onQuickExportThread={handleQuickExportThread}
          />
        </div>

        {/* Windows XP Status Bar */}
        <div className="xp-statusbar select-none">
          <div className="xp-status-pane flex-1 flex items-center gap-1.5 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-green-600 inline-block animate-pulse" />
            <span className="font-semibold">{progress.detailMessage}</span>
          </div>

          <div className="xp-status-pane w-48 font-mono text-gray-700 truncate">
            {threads.length} Threads ({totalRawFilesCount} files)
          </div>

          <div className="xp-status-pane w-52 font-mono text-gray-700 truncate">
            Selected: {selectedCount} ({selectedMessagesCount.toLocaleString()} msgs)
          </div>

          <div className="xp-status-pane w-40 text-center text-gray-600 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-700" />
            <span>100% Client-Side</span>
          </div>
        </div>
      </div>

      {/* Inspect & Preview Modal */}
      {inspectingThread && (
        <ThreadDetailViewer
          thread={inspectingThread}
          onClose={() => setInspectingThread(null)}
          onTogglePartSelect={handleTogglePartSelect}
        />
      )}

      {/* Export Suite Modal */}
      {showExportModal && (
        <ExportDialog
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          threads={threads}
        />
      )}

      {/* Help / Guide Modal */}
      {showHelpModal && (
        <HelpDialog
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      )}

      {/* Features Catalog & LLM Roadmap Modal */}
      {showFeaturesModal && (
        <FeaturesExplorerDialog
          isOpen={showFeaturesModal}
          onClose={() => setShowFeaturesModal(false)}
        />
      )}
    </div>
  );
}
