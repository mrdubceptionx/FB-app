import React from 'react';
import { HelpCircle, FileCode, CheckCircle2, Sparkles, BookOpen, Layers } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 backdrop-blur-xs">
      <div className="xp-window w-full max-w-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Title Bar */}
        <div className="xp-titlebar xp-titlebar-active flex items-center justify-between select-none">
          <div className="flex items-center gap-2 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-white" />
            <span>Help & Multi-Part Guide — Messenger Combiner</span>
          </div>
          <button
            onClick={onClose}
            className="xp-btn-ctrl xp-btn-close text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-[#ece9d8] max-h-[75vh] overflow-auto space-y-4 text-[11px]">
          {/* Intro Box */}
          <div className="xp-inset p-3 bg-white">
            <h3 className="font-bold text-sm text-[#003399] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>How Multi-Part Messenger Combining Works</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              When downloading Facebook Messenger data archives, Facebook splits large conversation histories into multiple HTML files (e.g. <code className="font-mono bg-gray-100 px-1 border">message_1.html</code>, <code className="font-mono bg-gray-100 px-1 border">message_2.html</code>, etc.). This tool automatically detects matching conversations, orders them chronologically, deduplicates overlapping messages, and creates unified Markdown and HTML documents.
            </p>
          </div>

          {/* Section: Ingestion */}
          <div className="xp-groove p-3 bg-[#ece9d8]">
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#0055ea]" />
              <span>1. Supported File Ingestion Methods</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Add Folder:</strong> Select your extracted <code className="font-mono bg-white px-1">your_facebook_activity/messages/inbox</code> folder.</li>
              <li><strong>Upload ZIP:</strong> Directly drop the official Facebook export <code className="font-mono bg-white px-1">.zip</code> archive without extracting it first.</li>
              <li><strong>Add HTML Files:</strong> Drag and drop any collection of multi-part <code className="font-mono bg-white px-1">.html</code> files.</li>
              <li><strong>Sample Dataset:</strong> Click <em>"Load Sample Dataset"</em> to test multi-part grouping with realistic data.</li>
            </ul>
          </div>

          {/* Section: Markdown Output Schema */}
          <div className="xp-groove p-3 bg-[#ece9d8]">
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-[#0055ea]" />
              <span>2. Output Schema & NotebookLM Optimization</span>
            </h4>
            <p className="text-gray-700 mb-2">
              The generated Markdown files follow a clean, hierarchical format optimized for Google Gemini Notebook / NotebookLM ingestion:
            </p>
            <pre className="xp-inset p-2.5 bg-gray-900 text-green-400 font-mono text-[11px] overflow-x-auto rounded">
{`# Conversation Archive: Marianne Carmen Perli & Madis Lemberk

## 📅 2021-04-06 (Tuesday)
- **[03:40:32] Marianne Carmen Perli**: Tsss
- **[03:43:27] Madis Lemberk**: Ooooh no
- **[03:43:57] Madis Lemberk**: Palj jalutd oli
- **[13:41:45] Madis Lemberk**: 📷 *[Photo]* *(Reactions: 🥰Marianne Carmen Perli)*`}
            </pre>
          </div>

          {/* Privacy Note */}
          <div className="xp-inset p-2.5 bg-[#e8f5e9] border border-green-300 text-green-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>100% Client-Side & Private:</strong> All file processing, decompression, and stitching occurs strictly inside your browser. No messages, photos, or data are transmitted over the network.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#ece9d8] border-t border-[#aca899] px-4 py-2 flex justify-end">
          <button
            onClick={onClose}
            className="xp-button py-1 px-4 font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
