import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  FileCode, 
  Eye, 
  Download, 
  Layers, 
  Calendar, 
  Users,
  Search,
  Filter
} from 'lucide-react';
import { ConversationThread, FilterState } from '../types';

interface ThreadManagerTableProps {
  threads: ConversationThread[];
  onToggleThreadSelect: (threadId: string) => void;
  onTogglePartSelect: (threadId: string, partId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInspectThread: (thread: ConversationThread) => void;
  onQuickExportThread: (thread: ConversationThread) => void;
}

export const ThreadManagerTable: React.FC<ThreadManagerTableProps> = ({
  threads,
  onToggleThreadSelect,
  onTogglePartSelect,
  onSelectAll,
  onDeselectAll,
  onInspectThread,
  onQuickExportThread,
}) => {
  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    hideEmpty: true,
    onlyMultiPart: false,
    selectedOnly: false,
  });

  const toggleExpand = (id: string) => {
    setExpandedThreadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedThreadIds(new Set(threads.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedThreadIds(new Set());
  };

  // Filter threads
  const filteredThreads = threads.filter(t => {
    if (filterState.hideEmpty && t.totalMessages === 0) return false;
    if (filterState.onlyMultiPart && t.parts.length <= 1) return false;
    if (filterState.selectedOnly && !t.selected) return false;

    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchId = t.baseId.toLowerCase().includes(q);
      const matchParticipants = t.participants.some(p => p.toLowerCase().includes(q));
      const matchFiles = t.parts.some(p => p.fileName.toLowerCase().includes(q));
      return matchTitle || matchId || matchParticipants || matchFiles;
    }
    return true;
  });

  const allSelected = threads.length > 0 && threads.every(t => t.selected);
  const someSelected = threads.some(t => t.selected) && !allSelected;

  const formatDateShort = (d: Date | null) => {
    if (!d) return 'N/A';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-[#ece9d8]">
      {/* Search & Sub-Filter Bar */}
      <div className="p-2 border-b border-[#aca899] bg-[#f0eee4] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Search Box */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            id="input-search-threads"
            type="text"
            placeholder="Search conversations, participant names, or filenames..."
            value={filterState.searchQuery}
            onChange={e => setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="xp-inset-bevel px-2 py-1 flex-1 text-[11px] outline-none"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => setFilterState(prev => ({ ...prev, searchQuery: '' }))}
              className="text-gray-500 hover:text-black px-1 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Checkboxes */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              id="filter-only-multipart"
              type="checkbox"
              checked={filterState.onlyMultiPart}
              onChange={e => setFilterState(prev => ({ ...prev, onlyMultiPart: e.target.checked }))}
            />
            <span>Only Multi-Part ({threads.filter(t => t.parts.length > 1).length})</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              id="filter-selected-only"
              type="checkbox"
              checked={filterState.selectedOnly}
              onChange={e => setFilterState(prev => ({ ...prev, selectedOnly: e.target.checked }))}
            />
            <span>Selected Only ({threads.filter(t => t.selected).length})</span>
          </label>

          <div className="h-4 w-px bg-[#aca899]" />

          <button
            onClick={expandAll}
            className="xp-button py-0.5 px-2 text-[10px]"
            title="Expand all thread sub-parts"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="xp-button py-0.5 px-2 text-[10px]"
            title="Collapse all sub-parts"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto bg-white xp-inset-bevel m-2">
        <table className="w-full text-left border-collapse xp-table">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-8 text-center">
                <input
                  id="master-select-checkbox"
                  type="checkbox"
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={e => (e.target.checked ? onSelectAll() : onDeselectAll())}
                  title="Select / Deselect all visible threads"
                />
              </th>
              <th className="w-8 text-center">+/-</th>
              <th>Conversation / Thread Title</th>
              <th className="w-28 text-center">Parts Detected</th>
              <th className="w-28 text-right">Total Messages</th>
              <th className="w-48">Date Span</th>
              <th className="w-40 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredThreads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500 italic bg-gray-50">
                  {threads.length === 0
                    ? 'No Messenger HTML export files loaded yet. Click "Add Folder", "Upload ZIP", or "Load Sample Dataset" above.'
                    : 'No conversation threads match your current search/filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredThreads.map(thread => {
                const isExpanded = expandedThreadIds.has(thread.id);
                const hasMultipleParts = thread.parts.length > 1;
                const activePartsCount = thread.parts.filter(p => p.selected).length;

                return (
                  <React.Fragment key={thread.id}>
                    {/* Primary Thread Row */}
                    <tr
                      className={`border-b transition-colors ${
                        thread.selected ? 'bg-[#f0f6ff]' : 'bg-white opacity-70'
                      }`}
                    >
                      {/* Thread Checkbox */}
                      <td className="text-center py-1.5 px-2">
                        <input
                          id={`thread-chk-${thread.id}`}
                          type="checkbox"
                          checked={thread.selected}
                          onChange={() => onToggleThreadSelect(thread.id)}
                          className="cursor-pointer"
                        />
                      </td>

                      {/* Expand / Collapse Button */}
                      <td className="text-center py-1.5 px-1">
                        <button
                          onClick={() => toggleExpand(thread.id)}
                          className="p-0.5 hover:bg-gray-200 rounded text-gray-600 focus:outline-none"
                          title={isExpanded ? 'Collapse sub-parts' : 'Expand sub-parts'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-700 font-bold" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </button>
                      </td>

                      {/* Title & Participants */}
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#0055ea] flex-shrink-0" />
                          <div>
                            <div className="font-bold text-[12px] text-gray-900 flex items-center gap-1.5">
                              <span>{thread.title}</span>
                              {hasMultipleParts && (
                                <span className="bg-[#e2edff] text-[#003399] border border-[#a6c8ff] px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                  {thread.parts.length} Split Parts
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                              <span>ID: {thread.baseId}</span>
                              {thread.participants.length > 0 && (
                                <span className="text-gray-600 truncate max-w-xs">
                                  • {thread.participants.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parts Count Badge */}
                      <td className="text-center py-1.5 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                            hasMultipleParts
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          {activePartsCount} / {thread.parts.length}
                        </span>
                      </td>

                      {/* Total Messages */}
                      <td className="text-right py-1.5 px-2 font-mono font-semibold text-gray-800">
                        {thread.totalMessages.toLocaleString()} msgs
                      </td>

                      {/* Date Span */}
                      <td className="py-1.5 px-2 text-[10px] text-gray-600">
                        {thread.dateRange.start ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>
                              {formatDateShort(thread.dateRange.start)} → {formatDateShort(thread.dateRange.end)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No timestamps detected</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-center py-1.5 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-inspect-${thread.id}`}
                            onClick={() => onInspectThread(thread)}
                            className="xp-button py-0.5 px-2 text-[10px] flex items-center gap-1"
                            title="Inspect stitched transcript in Markdown & Chat view"
                          >
                            <Eye className="w-3 h-3 text-[#0055ea]" />
                            <span>Preview</span>
                          </button>

                          <button
                            id={`btn-export-${thread.id}`}
                            onClick={() => onQuickExportThread(thread)}
                            className="xp-button py-0.5 px-2 text-[10px] flex items-center gap-1"
                            title="Quick export this conversation to Markdown"
                          >
                            <Download className="w-3 h-3 text-[#006600]" />
                            <span>Export</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-View: Expanded File Parts Breakdown */}
                    {isExpanded && (
                      <tr className="bg-[#f7f9fd]">
                        <td colSpan={7} className="p-0 border-b border-[#a6c8ff]">
                          <div className="p-3 pl-12 bg-[#f4f7fc] border-l-4 border-[#0055ea]">
                            <div className="text-[11px] font-bold text-[#003399] mb-1.5 flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5" />
                              <span>Individual File Parts ({thread.parts.length} files detected for this thread)</span>
                              <span className="text-[10px] font-normal text-gray-500">
                                — You can uncheck individual parts to exclude them from the stitched transcript.
                              </span>
                            </div>

                            <div className="space-y-1 mt-2">
                              {thread.parts.map((part, pIdx) => (
                                <div
                                  key={part.id}
                                  className={`flex items-center justify-between p-1.5 rounded border text-[11px] ${
                                    part.selected
                                      ? 'bg-white border-[#cbd5e1]'
                                      : 'bg-gray-100 border-gray-300 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      id={`part-chk-${part.id}`}
                                      type="checkbox"
                                      checked={part.selected}
                                      onChange={() => onTogglePartSelect(thread.id, part.id)}
                                      className="cursor-pointer"
                                    />
                                    <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] border">
                                      Part {part.partNumber || pIdx + 1}
                                    </span>
                                    <span className="font-mono text-gray-900 font-medium">
                                      {part.fileName}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      ({(part.fileSize / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4 text-[10px] text-gray-600 font-mono">
                                    <span>{part.messageCount} messages</span>
                                    <span>
                                      {part.dateRange.start
                                        ? `${formatDateShort(part.dateRange.start)} - ${formatDateShort(part.dateRange.end)}`
                                        : 'No dates'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
