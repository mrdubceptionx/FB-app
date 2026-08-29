import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  FileText, 
  Eye, 
  Layers, 
  Calendar, 
  Search,
  Maximize2,
  Sparkles,
  Zap
} from 'lucide-react';
import { ConversationThread, ExportOptions } from '../types';
import { 
  generateThreadMarkdown, 
  generateThreadHTML, 
  downloadFile, 
  estimateTokensAndWords,
  prepareMessagesForExport 
} from '../utils/exporter';
import { getStitchedMessages } from '../utils/threadGrouper';

interface ThreadDetailViewerProps {
  thread: ConversationThread | null;
  onClose: () => void;
  onTogglePartSelect: (threadId: string, partId: string) => void;
}

export const ThreadDetailViewer: React.FC<ThreadDetailViewerProps> = ({
  thread,
  onClose,
  onTogglePartSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'rendered' | 'parts'>('markdown');
  const [copied, setCopied] = useState(false);
  const [searchInThread, setSearchInThread] = useState('');
  const [groupByDay, setGroupByDay] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [includeReactions, setIncludeReactions] = useState(true);
  const [mergeConsecutive, setMergeConsecutive] = useState(true);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const exportOptions: Partial<ExportOptions> = useMemo(() => ({
    sortOrder,
    groupByDay,
    includeReactions,
    includeMediaPlaceholders: true,
    optimizeForNotebookLM: true,
    mergeConsecutiveMessages: mergeConsecutive,
    timestampFormat: '24h',
    dateFilterStart: dateStart || undefined,
    dateFilterEnd: dateEnd || undefined,
  }), [sortOrder, groupByDay, includeReactions, mergeConsecutive, dateStart, dateEnd]);

  const markdownContent = useMemo(() => {
    if (!thread) return '';
    return generateThreadMarkdown(thread, exportOptions);
  }, [thread, exportOptions]);

  const tokenStats = useMemo(() => {
    return estimateTokensAndWords(markdownContent);
  }, [markdownContent]);

  const stitchedMessages = useMemo(() => {
    if (!thread) return [];
    const msgs = prepareMessagesForExport(thread, exportOptions);
    if (!searchInThread.trim()) return msgs;
    const q = searchInThread.toLowerCase();
    return msgs.filter(m => 
      m.sender.toLowerCase().includes(q) || 
      m.content.toLowerCase().includes(q) ||
      m.rawTimestamp.toLowerCase().includes(q)
    );
  }, [thread, exportOptions, searchInThread]);

  if (!thread) return null;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const filename = `${thread.baseId || 'conversation'}_archive.md`;
    downloadFile(markdownContent, filename, 'text/markdown');
  };

  const handlePrintHTML = () => {
    const html = generateThreadHTML(thread, exportOptions);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleDownloadHTML = () => {
    const html = generateThreadHTML(thread, exportOptions);
    const filename = `${thread.baseId || 'conversation'}_archive.html`;
    downloadFile(html, filename, 'text/html');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-6 backdrop-blur-xs">
      <div className="xp-window w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* XP Title Bar */}
        <div className="xp-titlebar xp-titlebar-active flex items-center justify-between select-none">
          <div className="flex items-center gap-2 font-bold text-xs">
            <FileText className="w-4 h-4 text-white" />
            <span className="truncate">Transcript Inspector — {thread.title} ({stitchedMessages.length} msgs)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="xp-btn-ctrl xp-btn-close text-xs"
              title="Close Preview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar & Tab Header */}
        <div className="bg-[#ece9d8] border-b border-[#aca899] px-3 pt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`xp-tab ${activeTab === 'markdown' ? 'xp-tab-active' : ''}`}
            >
              📝 Markdown (.md)
            </button>
            <button
              onClick={() => setActiveTab('rendered')}
              className={`xp-tab ${activeTab === 'rendered' ? 'xp-tab-active' : ''}`}
            >
              💬 Visual Chat View
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`xp-tab ${activeTab === 'parts' ? 'xp-tab-active' : ''}`}
            >
              📂 Stitched Parts ({thread.parts.length})
            </button>
          </div>

          {/* Quick Actions & Token Stats */}
          <div className="flex items-center gap-2 pb-1">
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] bg-white px-2 py-0.5 border border-[#aca899] rounded">
              <span className="text-amber-800 font-bold">{tokenStats.words.toLocaleString()} words</span>
              <span className="text-gray-400">•</span>
              <span className="text-purple-800 font-bold">~{tokenStats.tokens.toLocaleString()} tokens</span>
            </div>

            {activeTab === 'markdown' ? (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="xp-button flex items-center gap-1 py-1 px-2.5 font-semibold text-[#003399]"
                  title="Copy formatted markdown to clipboard (ready for NotebookLM)"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="xp-button flex items-center gap-1 py-1 px-2.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#0055ea]" />
                  <span>Download .md</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePrintHTML}
                  className="xp-button flex items-center gap-1 py-1 px-2.5 font-semibold text-[#003399]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print to PDF</span>
                </button>

                <button
                  onClick={handleDownloadHTML}
                  className="xp-button flex items-center gap-1 py-1 px-2.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#0055ea]" />
                  <span>Download .html</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Tuning Controls for Preview */}
        <div className="bg-[#f2efe4] border-b border-[#aca899] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByDay}
                onChange={e => setGroupByDay(e.target.checked)}
              />
              <span>Group by Day</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeReactions}
                onChange={e => setIncludeReactions(e.target.checked)}
              />
              <span>Reactions</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer text-[#003399] font-bold">
              <input
                type="checkbox"
                checked={mergeConsecutive}
                onChange={e => setMergeConsecutive(e.target.checked)}
              />
              <span>Merge Rapid Bursts</span>
            </label>

            <div className="flex items-center gap-1">
              <span className="text-gray-600">Order:</span>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="xp-inset-bevel px-1 py-0.5 text-[11px]"
              >
                <option value="asc">Oldest First</option>
                <option value="desc">Newest First</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-gray-600 text-[10px]">Filter:</span>
              <input
                type="date"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                className="xp-inset-bevel px-1 py-0.5 text-[10px] bg-white font-mono"
                title="Start Date"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                className="xp-inset-bevel px-1 py-0.5 text-[10px] bg-white font-mono"
                title="End Date"
              />
              {(dateStart || dateEnd) && (
                <button
                  onClick={() => { setDateStart(''); setDateEnd(''); }}
                  className="text-red-600 font-bold px-1"
                  title="Clear Date Filter"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchInThread}
                onChange={e => setSearchInThread(e.target.value)}
                className="xp-inset-bevel px-2 py-0.5 text-[11px] w-32"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-3 bg-white">
          {activeTab === 'markdown' && (
            <div className="h-full flex flex-col">
              <div className="text-[11px] text-gray-500 mb-2 font-sans bg-blue-50 p-2 border border-blue-200 rounded flex items-center justify-between">
                <span>
                  💡 <strong>NotebookLM / Gemini Optimized:</strong> Formatted with clean date headers and speaker tags.
                </span>
                <span className="font-mono text-[10px] text-blue-900 font-bold">
                  {tokenStats.words.toLocaleString()} words (~{tokenStats.tokens.toLocaleString()} tokens)
                </span>
              </div>
              <textarea
                readOnly
                value={markdownContent}
                className="xp-inset p-3 w-full h-[400px] font-mono text-[12px] leading-relaxed text-gray-900 resize-none outline-none select-text"
              />
            </div>
          )}

          {activeTab === 'rendered' && (
            <div className="space-y-2 p-2">
              <div className="border-b pb-2 mb-3">
                <h2 className="text-lg font-bold text-[#0055ea]">{thread.title}</h2>
                <div className="text-xs text-gray-600">
                  Participants: {thread.participants.join(', ') || 'N/A'} • {stitchedMessages.length} Messages in scope
                </div>
              </div>

              {stitchedMessages.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">
                  No messages match search or date filter.
                </div>
              ) : (
                stitchedMessages.map((msg, i) => (
                  <div key={msg.id || i} className="border border-gray-200 rounded p-2.5 bg-gray-50 hover:bg-white transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-gray-800">{msg.sender}</span>
                      <span className="text-gray-500 font-mono text-[10px]">
                        {msg.timestamp ? msg.timestamp.toLocaleString() : msg.rawTimestamp}
                      </span>
                    </div>

                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {msg.photos.length > 0 && (
                        <div className="mb-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
                          📷 Photo Attachment ({msg.photos.length})
                        </div>
                      )}
                      {msg.content || <em className="text-gray-400">[Empty content]</em>}
                    </div>

                    {msg.reactions.length > 0 && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {msg.reactions.map((r, ri) => (
                          <span key={ri} className="bg-gray-200 text-gray-800 text-[10px] px-1.5 py-0.5 rounded-full">
                            {r.reaction} {r.actor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="space-y-2 p-2">
              <div className="text-xs text-gray-600 mb-3">
                Below are the individual split HTML files detected for <strong>{thread.title}</strong>. Check or uncheck a part to include/exclude it from the combined transcript.
              </div>

              {thread.parts.map((part) => (
                <div
                  key={part.id}
                  className={`p-3 rounded border flex items-center justify-between ${
                    part.selected ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={part.selected}
                      onChange={() => onTogglePartSelect(thread.id, part.id)}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-bold font-mono text-sm text-gray-900">
                        {part.fileName}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        Path: {part.filePath}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-gray-700">
                    <div className="font-semibold">{part.messageCount} messages</div>
                    <div className="text-gray-500">{(part.fileSize / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#ece9d8] border-t border-[#aca899] px-3 py-2 flex items-center justify-between select-none">
          <span className="text-[11px] text-gray-600">
            {thread.parts.filter(p => p.selected).length} of {thread.parts.length} parts active • ~{tokenStats.words.toLocaleString()} words
          </span>
          <button
            onClick={onClose}
            className="xp-button py-1 px-4 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

