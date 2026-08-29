import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ShieldCheck, 
  Cpu, 
  FileCode, 
  Layers, 
  Zap, 
  SlidersHorizontal,
  BookmarkCheck,
  HelpCircle,
  X
} from 'lucide-react';

export interface FeatureItem {
  id: string;
  title: string;
  category: 'llm' | 'privacy' | 'media' | 'stitching' | 'export';
  categoryLabel: string;
  status: 'implemented' | 'ready';
  statusLabel: string;
  impact: 'High' | 'Medium' | 'Essential';
  description: string;
  llmBenefit: string;
  howToUse: string;
  tags: string[];
}

export const ALL_FEATURES_CATALOG: FeatureItem[] = [
  // 1. LLM & NotebookLM Optimization
  {
    id: 'burst-merging',
    title: 'Consecutive Rapid-Burst Message Merging',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'High',
    description: 'Groups multiple rapid-fire messages sent by the same speaker within 5 minutes into a single unified block with one timestamp header.',
    llmBenefit: 'Saves 30–40% token overhead by stripping redundant speaker prefixes while preserving natural conversational flow.',
    howToUse: 'Toggled by default in the Export Suite & Live Inspector ("Merge Rapid Bursts").',
    tags: ['tokens', 'context window', 'efficiency', 'merging', 'speaker']
  },
  {
    id: 'time-chunking',
    title: 'Time-Based Chunking (Yearly / Quarterly / Monthly)',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'High',
    description: 'Slices multi-year Messenger threads into discrete chronologically labeled files (e.g. `sarah_2021.md`, `sarah_2022.md`).',
    llmBenefit: 'Guarantees files stay well below NotebookLM’s 500k word limit, prevents context dilution across decades, and allows targeted era querying.',
    howToUse: 'Select Yearly, Quarterly, or Monthly in the Export Suite before downloading.',
    tags: ['yearly', 'chunking', 'notebooklm', 'source size', 'quarterly']
  },
  {
    id: 'date-range-filter',
    title: 'Granular Date Range Filtering',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Medium',
    description: 'Filter messages by start and end calendar dates before previewing or exporting.',
    llmBenefit: 'Isolates specific vacations, projects, or timeframes for focused LLM ingestion without extraneous history.',
    howToUse: 'Set "From Date" and "To Date" in the Export Suite or Thread Detail Viewer.',
    tags: ['dates', 'filter', 'calendar', 'timeframe']
  },
  {
    id: 'token-word-counter',
    title: 'Live Token & Word Capacity Estimator',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'High',
    description: 'Real-time estimation of word count, character volume, and LLM token load across single threads and batch selections.',
    llmBenefit: 'Lets you know instantly whether a chat fits in Gemini 1.5/2.0 context windows or NotebookLM source thresholds.',
    howToUse: 'View live badges in the Export Suite, Inspector, and Status Bar.',
    tags: ['tokens', 'words', 'estimator', 'context limits', 'metrics']
  },
  {
    id: 'prompt-starters',
    title: 'Companion Prompt Starters Guide (NOTEBOOKLM_PROMPTS.txt)',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Medium',
    description: 'Auto-generates tailored prompt starters (timeline extraction, shared favorites, inside joke recaps, year-over-year shifts).',
    llmBenefit: 'Immediate 1-click copyable prompts specifically formulated for chat transcript comprehension in NotebookLM & Gemini.',
    howToUse: 'Automatically included in the downloaded batch export ZIP archive.',
    tags: ['prompts', 'notebooklm', 'questions', 'templates', 'synthesis']
  },
  {
    id: 'yaml-frontmatter',
    title: 'Structured Metadata & YAML Header Block',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'High',
    description: 'Prepends machine-readable header data (participant roster, message totals, date range span, and file origin).',
    llmBenefit: 'Immediately grounds LLM system prompts on who is speaking, relationship scope, and total archive timeframe.',
    howToUse: 'Toggle "Add YAML / Metadata Headers" in the Export Suite.',
    tags: ['yaml', 'metadata', 'grounding', 'participants', 'header']
  },
  {
    id: 'system-event-cleaner',
    title: 'System Event & Automated Clutter Stripper',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'Medium',
    description: 'Filters out automated system noise like "Madis called you", "Missed video chat", "joined the call", or "set nickname".',
    llmBenefit: 'Removes non-conversational clutter that wastes context tokens.',
    howToUse: 'Can be added as a toggle in Export Suite ("Exclude System Event Logs").',
    tags: ['cleaning', 'system events', 'calls', 'noise reduction']
  },
  {
    id: 'citation-anchors',
    title: 'Daily Anchor Links for Exact LLM Citations',
    category: 'llm',
    categoryLabel: 'LLM & NotebookLM',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'Medium',
    description: 'Inserts discrete markdown anchor identifiers (`{#date-2023-08-14}`) at the start of each daily header.',
    llmBenefit: 'Enables LLM responses to provide direct verifiable jump links to specific days.',
    howToUse: 'Can be enabled in Markdown output settings.',
    tags: ['citations', 'anchors', 'grounding', 'links']
  },

  // 2. Privacy, Security & Sanitization
  {
    id: 'client-side-privacy',
    title: '100% Client-Side In-Browser Execution',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Essential',
    description: 'All HTML parsing, ZIP extraction, date sorting, and markdown synthesis happens locally in your browser memory.',
    llmBenefit: 'Zero telemetry, zero server uploads, and complete data privacy for intimate personal conversations.',
    howToUse: 'Always active out of the box.',
    tags: ['offline', 'client-side', 'zero-upload', 'security']
  },
  {
    id: 'pii-redactor',
    title: 'Automated PII Masker (Phone, Email, Credit Cards)',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'High',
    description: 'Regex-based redaction engine replacing phone numbers with `[REDACTED_PHONE]`, emails with `[REDACTED_EMAIL]`, and card numbers.',
    llmBenefit: 'Safeguards confidential personal info before uploading transcripts to cloud AI platforms.',
    howToUse: 'Can be configured with custom regex or preset rules before exporting.',
    tags: ['pii', 'redaction', 'privacy', 'phone', 'email', 'masking']
  },
  {
    id: 'pseudonymization',
    title: 'Participant Pseudonymizer / Custom Aliases',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'High',
    description: 'Map real full names to anonymized aliases (e.g. "Person A", "Speaker 1", or custom pseudonyms).',
    llmBenefit: 'Allows sharing research or transcripts with external LLM accounts without exposing real identities.',
    howToUse: 'Interactive alias replacement table per conversation.',
    tags: ['anonymization', 'aliases', 'privacy', 'names']
  },
  {
    id: 'secret-scrubber',
    title: 'Custom Keyword & Sensitive Word Scrubber',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'Medium',
    description: 'Define a custom blacklist of words, passwords, or street addresses to automatically redact with `***`.',
    llmBenefit: 'Prevents accidentally feeding private passwords or addresses into model context.',
    howToUse: 'Custom blacklist input field.',
    tags: ['blacklist', 'passwords', 'keywords', 'scrub']
  },

  // 3. Media, Links & Content Extraction
  {
    id: 'media-placeholders',
    title: 'Descriptive Media Placeholders (📷 Photo, 🎥 Video, 🎵 Audio)',
    category: 'media',
    categoryLabel: 'Media & Attachments',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Medium',
    description: 'Converts broken relative image tags into clean markdown placeholders with reaction attachments preserved.',
    llmBenefit: 'Informs the LLM that a photo or voice clip occurred at that exact second without crashing markdown parsers.',
    howToUse: 'Enabled via "Include Photo/Audio Placeholders" toggle.',
    tags: ['photos', 'videos', 'stickers', 'reactions', 'attachments']
  },
  {
    id: 'url-extractor',
    title: 'Dedicated Shared Links & URL Extractor (SHARED_LINKS.md)',
    category: 'media',
    categoryLabel: 'Media & Attachments',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'High',
    description: 'Scans all messages for links (YouTube, Spotify, Articles, TikTok, Google Maps) and outputs a categorized table.',
    llmBenefit: 'Gives NotebookLM a focused index of every media item or article ever shared in the relationship.',
    howToUse: 'Export companion `LINKS_INDEX.md` alongside transcripts.',
    tags: ['links', 'urls', 'youtube', 'spotify', 'articles', 'index']
  },
  {
    id: 'local-media-relinker',
    title: 'Local Media Relinker & Asset Matcher',
    category: 'media',
    categoryLabel: 'Media & Attachments',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'Medium',
    description: 'Preserves valid relative links to extracted photo folders (`photos/photo_123.jpg`) in standalone HTML exports.',
    llmBenefit: 'Produces fully visual offline browser archives with images intact.',
    howToUse: 'Folder matching option during ZIP/HTML export.',
    tags: ['images', 'photos', 'relinking', 'html view']
  },

  // 4. Multi-Part Stitching & Deduplication
  {
    id: 'thread-grouping',
    title: 'Intelligent Base-ID Thread Grouping',
    category: 'stitching',
    categoryLabel: 'Stitching Engine',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Essential',
    description: 'Strips Facebook suffix patterns (`_message_1`, `-2`, `inbox/madis_123`) to identify matching conversation parts.',
    llmBenefit: 'Combines fragmented multi-part archives into a unified continuous conversation without manual merging.',
    howToUse: 'Automatic upon folder, zip, or file selection.',
    tags: ['grouping', 'multi-part', 'regex', 'inbox', 'stitching']
  },
  {
    id: 'deduplication',
    title: 'Exact Timestamp & Content Deduplication',
    category: 'stitching',
    categoryLabel: 'Stitching Engine',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'High',
    description: 'Detects overlapping message entries across split files and ensures each message appears exactly once.',
    llmBenefit: 'Eliminates duplicate token consumption and prevents LLM repetition loops.',
    howToUse: 'Built-in automatically during parsing.',
    tags: ['deduplication', 'unique', 'clean', 'timestamps']
  },
  {
    id: 'part-picker',
    title: 'Selective Sub-Part Inclusion/Exclusion',
    category: 'stitching',
    categoryLabel: 'Stitching Engine',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Medium',
    description: 'Expand any thread in the table to check or uncheck individual files (`message_1.html`, `message_2.html`).',
    llmBenefit: 'Allows omitting legacy parts or only processing recent volumes.',
    howToUse: 'Click the arrow next to any thread in the main table.',
    tags: ['sub-parts', 'granular', 'table', 'toggle']
  },
  {
    id: 'archive-gap-detector',
    title: 'Time Gap & Missing Part Diagnostic Detector',
    category: 'stitching',
    categoryLabel: 'Stitching Engine',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'Medium',
    description: 'Scans stitched messages for unexpected multi-month gaps (e.g. "Missing message_3.html?") and flags warnings.',
    llmBenefit: 'Alerts you if Facebook failed to export an intermediate file before feeding the dataset to AI.',
    howToUse: 'Diagnostic badge in the Thread Manager table.',
    tags: ['diagnostics', 'gaps', 'integrity', 'missing files']
  },

  // 5. Export Formats & Compatibility
  {
    id: 'markdown-export',
    title: 'Clean Hierarchical Markdown (.md)',
    category: 'export',
    categoryLabel: 'Export & Compatibility',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Essential',
    description: 'Industry-standard markdown transcripts formatted with `## 📅 YYYY-MM-DD` day dividers and bulleted timestamps.',
    llmBenefit: 'The #1 recommended format for NotebookLM, Claude, ChatGPT, and Obsidian.',
    howToUse: 'Select Markdown format in Export Suite.',
    tags: ['markdown', 'md', 'standard', 'obsidian']
  },
  {
    id: 'html-pdf-export',
    title: 'Standalone Printable HTML with PDF Stylesheet',
    category: 'export',
    categoryLabel: 'Export & Compatibility',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'Medium',
    description: 'Self-contained offline webpage with a built-in Print / Save to PDF button and clean typography.',
    llmBenefit: 'Great for human reading, archival PDF generation, and paper printouts.',
    howToUse: 'Select Standalone HTML / PDF format in Export Suite.',
    tags: ['html', 'pdf', 'print', 'reading']
  },
  {
    id: 'batch-zip',
    title: 'Batch ZIP Packaging with Master Index',
    category: 'export',
    categoryLabel: 'Export & Compatibility',
    status: 'implemented',
    statusLabel: 'Implemented & Active',
    impact: 'High',
    description: 'Packages all selected threads into a clean `.zip` archive containing individual files and an `ARCHIVE_INDEX.txt` manifest.',
    llmBenefit: 'Allows drag-and-dropping all files directly into NotebookLM source manager at once.',
    howToUse: 'Select ZIP Archive mode in Export Suite.',
    tags: ['zip', 'batch', 'manifest', 'packaging']
  },
  {
    id: 'json-jsonl-export',
    title: 'Structured JSON & JSONL Formats',
    category: 'export',
    categoryLabel: 'Export & Compatibility',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'High',
    description: 'Export raw structured arrays with ISO timestamps, sender IDs, reactions array, and media metadata.',
    llmBenefit: 'Ideal for Python data science, LangChain agents, or fine-tuning models on personal speech patterns.',
    howToUse: 'Can be added as a format option (.json / .jsonl).',
    tags: ['json', 'jsonl', 'langchain', 'python', 'fine-tuning']
  },
  {
    id: 'csv-export',
    title: 'Tabular CSV / Spreadsheet Export',
    category: 'export',
    categoryLabel: 'Export & Compatibility',
    status: 'ready',
    statusLabel: 'Ready to Implement',
    impact: 'Medium',
    description: 'Generates a spreadsheet with columns: Date, Time, Sender, Content, Reaction Count, Media Type.',
    llmBenefit: 'Enables quick quantitative analysis in Excel, Google Sheets, or Code Interpreter.',
    howToUse: 'Can be added as a spreadsheet export option.',
    tags: ['csv', 'excel', 'spreadsheet', 'data']
  }
];

interface FeaturesExplorerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeaturesExplorerDialog: React.FC<FeaturesExplorerDialogProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFeatures = useMemo(() => {
    return ALL_FEATURES_CATALOG.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchBenefit = item.llmBenefit.toLowerCase().includes(q);
        const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchBenefit && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, selectedStatus, searchQuery]);

  const implementedCount = ALL_FEATURES_CATALOG.filter(f => f.status === 'implemented').length;
  const readyCount = ALL_FEATURES_CATALOG.filter(f => f.status === 'ready').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4 backdrop-blur-xs">
      <div className="xp-window w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Title Bar */}
        <div className="xp-titlebar xp-titlebar-active flex items-center justify-between select-none">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Feature Catalog & LLM Roadmap Explorer — [Windows XP]</span>
          </div>
          <button
            onClick={onClose}
            className="xp-btn-ctrl xp-btn-close text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-[#ece9d8] border-b border-[#aca899] p-3 space-y-2 text-[11px] select-none">
          {/* Top Row: Search + Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter by keyword (e.g. token, privacy, PII, JSON, chunking, prompts)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="xp-inset-bevel w-full pl-7 pr-7 py-1 text-[11px] bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded font-bold">
                ✅ {implementedCount} Active
              </span>
              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold">
                💡 {readyCount} Proposed
              </span>
              <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded font-bold">
                Showing {filteredFeatures.length} of {ALL_FEATURES_CATALOG.length}
              </span>
            </div>
          </div>

          {/* Bottom Row: Category & Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#aca899]/50">
            {/* Category Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-gray-700 font-bold pr-1">Category:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'llm', label: '🤖 LLM & NotebookLM' },
                { id: 'privacy', label: '🛡️ Privacy & Sanitization' },
                { id: 'media', label: '📎 Media & Links' },
                { id: 'stitching', label: '🧩 Stitching Engine' },
                { id: 'export', label: '📦 Export & Formats' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-0.5 px-2 text-[10px] rounded-xs border transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#316ac5] text-white border-[#1d428a] font-bold shadow-xs'
                      : 'bg-white text-gray-800 border-[#aca899] hover:bg-[#e0dfd6]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-700 font-bold">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="xp-inset-bevel px-1.5 py-0.5 text-[10px] bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="implemented">✅ Implemented & Active</option>
                <option value="ready">💡 Ready to Implement / Proposed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feature List Grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-[#f5f4ef] space-y-2.5">
          {filteredFeatures.length === 0 ? (
            <div className="p-8 text-center bg-white xp-inset text-gray-500">
              <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div className="font-bold text-gray-700">No matching features found</div>
              <div className="text-xs mt-1">Try clearing your search query or selecting "All Categories".</div>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setSearchQuery(''); }}
                className="xp-button mt-3 px-3 py-1 text-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredFeatures.map(feature => (
              <div
                key={feature.id}
                className="xp-inset p-3 bg-white hover:bg-[#faf9f5] transition-colors flex flex-col md:flex-row md:items-start gap-3 shadow-xs"
              >
                {/* Status Indicator & Category Badge */}
                <div className="md:w-44 flex-shrink-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {feature.status === 'implemented' ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-300">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        Active in App
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Proposed
                      </span>
                    )}

                    <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border">
                      {feature.impact}
                    </span>
                  </div>

                  <div className="text-[10px] font-bold text-[#0055ea] flex items-center gap-1">
                    {feature.category === 'llm' && <Cpu className="w-3 h-3" />}
                    {feature.category === 'privacy' && <ShieldCheck className="w-3 h-3" />}
                    {feature.category === 'media' && <Layers className="w-3 h-3" />}
                    {feature.category === 'stitching' && <BookmarkCheck className="w-3 h-3" />}
                    {feature.category === 'export' && <FileCode className="w-3 h-3" />}
                    <span>{feature.categoryLabel}</span>
                  </div>
                </div>

                {/* Main Feature Content */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[12px] text-gray-900 flex items-center gap-1.5">
                      <span>{feature.title}</span>
                    </h3>
                  </div>

                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* LLM & Notebook Benefit Box */}
                  <div className="bg-[#f0f7ff] border border-blue-200 p-2 rounded text-[10.5px] text-[#003399] flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Why it matters for LLM / NotebookLM:</strong> {feature.llmBenefit}
                    </div>
                  </div>

                  {/* How to Use / Status Notes */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-gray-500 border-t border-gray-100">
                    <div>
                      <span className="font-semibold text-gray-700">How it works:</span> {feature.howToUse}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {feature.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#ece9d8] border-t border-[#aca899] px-4 py-2 flex items-center justify-between select-none">
          <div className="text-[11px] text-gray-600">
            Click any filter above to narrow down features by category or development status.
          </div>
          <button
            onClick={onClose}
            className="xp-button py-1 px-4 font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
