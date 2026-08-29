import JSZip from 'jszip';
import { ConversationThread, ExportOptions, ParsedMessage } from '../types';
import { getStitchedMessages } from './threadGrouper';

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format day header e.g. "2021-04-06 (Tuesday)"
 */
export function formatDayHeader(date: Date): string {
  const dateKey = formatDateKey(date);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  return `${dateKey} (${dayName})`;
}

/**
 * Format timestamp e.g. "03:40:32" or "12:58:07 pm"
 */
export function formatTime(date: Date | null, rawFallback: string, format24h: boolean): string {
  if (!date) return rawFallback || '00:00:00';
  if (format24h) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }
}

/**
 * Estimate token and word count from string for NotebookLM / LLM capacity planning
 */
export function estimateTokensAndWords(text: string): { words: number; tokens: number; charCount: number } {
  if (!text) return { words: 0, tokens: 0, charCount: 0 };
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Standard token rule of thumb for English/European multilingual text is ~4 chars per token or ~1.3 tokens per word
  const charCount = text.length;
  const tokens = Math.round(charCount / 3.8);
  return { words, tokens, charCount };
}

/**
 * Filter and optionally merge messages based on options (date range, rapid consecutive message burst grouping)
 */
export function prepareMessagesForExport(
  thread: ConversationThread,
  options: Partial<ExportOptions> = {}
): ParsedMessage[] {
  const {
    sortOrder = 'asc',
    dateFilterStart,
    dateFilterEnd,
    mergeConsecutiveMessages = false,
  } = options;

  let messages = getStitchedMessages(thread, sortOrder);

  // Apply Date Range Filter if set
  if (dateFilterStart || dateFilterEnd) {
    const startTs = dateFilterStart ? new Date(`${dateFilterStart}T00:00:00`).getTime() : 0;
    const endTs = dateFilterEnd ? new Date(`${dateFilterEnd}T23:59:59.999`).getTime() : Infinity;

    messages = messages.filter(m => {
      if (!m.timestamp) return true;
      const t = m.timestamp.getTime();
      return t >= startTs && t <= endTs;
    });
  }

  // Consecutive message merging (Groups rapid-fire bursts from same sender within 5 mins)
  if (mergeConsecutiveMessages && messages.length > 1) {
    const merged: ParsedMessage[] = [];
    let currentBatch: ParsedMessage | null = null;

    for (const msg of messages) {
      if (!currentBatch) {
        currentBatch = { ...msg };
        continue;
      }

      const sameSender = currentBatch.sender === msg.sender;
      const timeDiffMinutes =
        currentBatch.timestamp && msg.timestamp
          ? Math.abs(msg.timestamp.getTime() - currentBatch.timestamp.getTime()) / 60000
          : 999;

      // If sent by same sender within 5 minutes, append content to reduce repetitive speaker tokens
      if (sameSender && timeDiffMinutes <= 5) {
        if (msg.content) {
          currentBatch.content = currentBatch.content
            ? `${currentBatch.content}\n${msg.content}`
            : msg.content;
        }
        if (msg.photos.length > 0) currentBatch.photos.push(...msg.photos);
        if (msg.videos.length > 0) currentBatch.videos.push(...msg.videos);
        if (msg.audio.length > 0) currentBatch.audio.push(...msg.audio);
        if (msg.stickers.length > 0) currentBatch.stickers.push(...msg.stickers);
        if (msg.reactions.length > 0) currentBatch.reactions.push(...msg.reactions);
      } else {
        merged.push(currentBatch);
        currentBatch = { ...msg };
      }
    }

    if (currentBatch) {
      merged.push(currentBatch);
    }
    return merged;
  }

  return messages;
}

/**
 * Generates a clean Markdown transcript for a conversation thread.
 */
export function generateThreadMarkdown(
  thread: ConversationThread,
  options: Partial<ExportOptions> = {},
  customMessages?: ParsedMessage[],
  chunkLabel?: string
): string {
  const {
    groupByDay = true,
    includeReactions = true,
    includeMediaPlaceholders = true,
    optimizeForNotebookLM = true,
    timestampFormat = '24h',
  } = options;

  const messages = customMessages || prepareMessagesForExport(thread, options);
  const lines: string[] = [];

  // Title Header
  const title = thread.title || thread.baseId;
  const chunkSuffix = chunkLabel ? ` [${chunkLabel}]` : '';
  lines.push(`# Conversation Archive: ${title}${chunkSuffix}`);
  lines.push('');

  // Metadata block (NotebookLM friendly)
  if (optimizeForNotebookLM) {
    lines.push(`> **Metadata**`);
    lines.push(`> - **Participants**: ${thread.participants.join(', ') || 'N/A'}`);
    lines.push(`> - **Total Messages in Scope**: ${messages.length}`);
    if (chunkLabel) {
      lines.push(`> - **Time Segment**: ${chunkLabel}`);
    }
    lines.push(`> - **Files Stitched**: ${thread.parts.filter(p => p.selected).map(p => p.fileName).join(', ')}`);
    if (thread.dateRange.start && thread.dateRange.end) {
      lines.push(`> - **Full Archive Date Span**: ${formatDateKey(thread.dateRange.start)} to ${formatDateKey(thread.dateRange.end)}`);
    }
    if (thread.generatedBy) {
      lines.push(`> - **Source Facebook Export**: Generated by ${thread.generatedBy} ${thread.generationDate ? `on ${thread.generationDate}` : ''}`);
    }
    lines.push('');
  }

  if (messages.length === 0) {
    lines.push('*No messages found matching selected criteria or date range.*');
    return lines.join('\n');
  }

  let currentDay = '';

  for (const msg of messages) {
    // Day grouping header
    if (groupByDay && msg.timestamp) {
      const dayHeader = formatDayHeader(msg.timestamp);
      if (dayHeader !== currentDay) {
        currentDay = dayHeader;
        lines.push(`## 📅 ${dayHeader}`);
        lines.push('');
      }
    }

    const timeStr = formatTime(msg.timestamp, msg.rawTimestamp, timestampFormat === '24h');
    let messageBody = msg.content;

    // Attachments & Photos
    if (includeMediaPlaceholders) {
      const mediaNotes: string[] = [];
      if (msg.photos.length > 0) {
        msg.photos.forEach(() => mediaNotes.push('📷 *[Photo]*'));
      }
      if (msg.audio.length > 0) {
        mediaNotes.push('🎵 *[Audio/Voice Note]*');
      }
      if (msg.isCall) {
        mediaNotes.push('📞 *[Call Event]*');
      }

      if (mediaNotes.length > 0) {
        const notesStr = mediaNotes.join(' ');
        messageBody = messageBody ? `${notesStr} ${messageBody}` : notesStr;
      }
    }

    // Reactions
    if (includeReactions && msg.reactions.length > 0) {
      const reactionsStr = msg.reactions
        .map(r => `${r.reaction}${r.actor ? r.actor : ''}`)
        .join(' ');
      messageBody = `${messageBody} *(Reactions: ${reactionsStr})*`;
    }

    if (!messageBody.trim()) {
      messageBody = '*[Empty message]*';
    }

    // Handle multiline combined messages
    if (messageBody.includes('\n')) {
      const splitLines = messageBody.split('\n');
      lines.push(`- **[${timeStr}] ${msg.sender}**: ${splitLines[0]}`);
      for (let i = 1; i < splitLines.length; i++) {
        lines.push(`  ${splitLines[i]}`);
      }
    } else {
      lines.push(`- **[${timeStr}] ${msg.sender}**: ${messageBody}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('*Export generated with Messenger HTML Multi-Part Combiner*');

  return lines.join('\n');
}

/**
 * Generates clean standalone HTML / Printable PDF transcript
 */
export function generateThreadHTML(
  thread: ConversationThread,
  options: Partial<ExportOptions> = {},
  customMessages?: ParsedMessage[],
  chunkLabel?: string
): string {
  const {
    groupByDay = true,
    includeReactions = true,
    includeMediaPlaceholders = true,
    timestampFormat = '24h',
  } = options;

  const messages = customMessages || prepareMessagesForExport(thread, options);
  const title = thread.title || thread.baseId;
  const chunkSuffix = chunkLabel ? ` [${chunkLabel}]` : '';

  // Build message rows
  let currentDay = '';
  const rows: string[] = [];

  for (const msg of messages) {
    if (groupByDay && msg.timestamp) {
      const dayHeader = formatDayHeader(msg.timestamp);
      if (dayHeader !== currentDay) {
        currentDay = dayHeader;
        rows.push(`
          <div class="day-divider">
            <span>📅 ${escapeHtml(dayHeader)}</span>
          </div>
        `);
      }
    }

    const timeStr = formatTime(msg.timestamp, msg.rawTimestamp, timestampFormat === '24h');
    let contentHtml = escapeHtml(msg.content);

    if (includeMediaPlaceholders) {
      if (msg.photos.length > 0) {
        contentHtml = `<span class="badge media-badge">📷 Photo (${msg.photos.length})</span> ` + contentHtml;
      }
      if (msg.audio.length > 0) {
        contentHtml = `<span class="badge audio-badge">🎵 Voice Note</span> ` + contentHtml;
      }
      if (msg.isCall) {
        contentHtml = `<span class="badge call-badge">📞 Call</span> ` + contentHtml;
      }
    }

    let reactionsHtml = '';
    if (includeReactions && msg.reactions.length > 0) {
      const reactionTags = msg.reactions
        .map(r => `<span class="reaction-tag">${escapeHtml(r.reaction)} ${escapeHtml(r.actor)}</span>`)
        .join(' ');
      reactionsHtml = `<div class="reactions-box">${reactionTags}</div>`;
    }

    rows.push(`
      <div class="message-card">
        <div class="message-header">
          <span class="sender-name">${escapeHtml(msg.sender)}</span>
          <span class="timestamp">${escapeHtml(timeStr)}</span>
        </div>
        <div class="message-body">${contentHtml || '<em style="color:#888;">(Empty content)</em>'}</div>
        ${reactionsHtml}
      </div>
    `);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}${escapeHtml(chunkSuffix)} - Messenger Archive</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background-color: #f4f6f8;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .header {
      border-bottom: 2px solid #0055ea;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #0055ea;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
      font-size: 13px;
      color: #555;
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
    }
    .actions-bar {
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
    }
    .print-btn {
      background: #0055ea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    }
    .day-divider {
      text-align: center;
      margin: 24px 0 16px 0;
      position: relative;
    }
    .day-divider span {
      background: #e2e8f0;
      padding: 4px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .message-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 8px;
      background: #ffffff;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .sender-name {
      font-weight: 700;
      color: #0f172a;
    }
    .timestamp {
      color: #64748b;
    }
    .message-body {
      font-size: 14px;
      color: #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      margin-right: 6px;
    }
    .media-badge { background: #e0f2fe; color: #0284c7; }
    .audio-badge { background: #fef3c7; color: #d97706; }
    .call-badge { background: #fee2e2; color: #dc2626; }
    .reactions-box {
      margin-top: 6px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .reaction-tag {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 11px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 0; max-width: 100%; }
      .actions-bar { display: none; }
      .message-card { page-break-inside: avoid; border-color: #ddd; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="actions-bar">
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    <div class="header">
      <h1>💬 ${escapeHtml(title)}${escapeHtml(chunkSuffix)}</h1>
      <div class="meta-grid">
        <div><strong>Participants:</strong> ${escapeHtml(thread.participants.join(', ') || 'N/A')}</div>
        <div><strong>Messages in Scope:</strong> ${messages.length}</div>
        <div><strong>Parts Stitched:</strong> ${thread.parts.filter(p => p.selected).length}</div>
        <div><strong>Date Span:</strong> ${thread.dateRange.start ? formatDateKey(thread.dateRange.start) : 'N/A'} - ${thread.dateRange.end ? formatDateKey(thread.dateRange.end) : 'N/A'}</div>
      </div>
    </div>
    <div class="messages-stream">
      ${rows.join('\n')}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Splits a conversation into time chunks (Yearly, Quarterly, Monthly) for discrete NotebookLM files
 */
export function splitThreadByTimeChunk(
  thread: ConversationThread,
  options: Partial<ExportOptions> = {}
): { label: string; chunkKey: string; messages: ParsedMessage[] }[] {
  const mode = options.timeChunking || 'none';
  const allMessages = prepareMessagesForExport(thread, options);

  if (mode === 'none' || allMessages.length === 0) {
    return [{ label: 'Full Archive', chunkKey: 'full', messages: allMessages }];
  }

  const groups = new Map<string, { label: string; chunkKey: string; messages: ParsedMessage[] }>();

  for (const msg of allMessages) {
    let key = 'undated';
    let label = 'Undated Messages';

    if (msg.timestamp) {
      const year = msg.timestamp.getFullYear();
      const monthNum = msg.timestamp.getMonth() + 1;
      const monthStr = String(monthNum).padStart(2, '0');

      if (mode === 'yearly') {
        key = `${year}`;
        label = `Year ${year}`;
      } else if (mode === 'quarterly') {
        const quarter = Math.ceil(monthNum / 3);
        key = `${year}_Q${quarter}`;
        label = `${year} Quarter ${quarter}`;
      } else if (mode === 'monthly') {
        key = `${year}_${monthStr}`;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        label = `${monthNames[msg.timestamp.getMonth()]} ${year}`;
      }
    }

    if (!groups.has(key)) {
      groups.set(key, { label, chunkKey: key, messages: [] });
    }
    groups.get(key)!.messages.push(msg);
  }

  // Sort groups chronologically
  return Array.from(groups.values()).sort((a, b) => a.chunkKey.localeCompare(b.chunkKey));
}

/**
 * Generates ready-to-use NotebookLM prompt starters tailored to the exported archive
 */
export function generateNotebookLMPrompts(threads: ConversationThread[]): string {
  const participantSet = new Set<string>();
  threads.forEach(t => t.participants.forEach(p => participantSet.add(p)));
  const participantList = Array.from(participantSet).join(', ') || 'the participants';

  return `========================================================================
GOOGLE NOTEBOOKLM / GEMINI PROMPT STARTERS
========================================================================
These prompts are crafted for your Messenger archive (${participantList}).
Upload your exported .md files to NotebookLM (https://notebooklm.google.com)
as Sources, then copy & paste any of the following queries:

--- 1. CHRONOLOGICAL TIMELINE & MAJOR LIFE EVENTS ---
"Create a comprehensive chronological timeline of major events, milestones, travels, celebrations, and life changes discussed by ${participantList}. Organize by year and month with exact source quotes and dates."

--- 2. SHARED RECOMMENDATIONS & FAVORITES ---
"Extract all media, music, movies, books, YouTube links, TV shows, recipes, restaurants, and places that were recommended or shared between ${participantList}. Categorize them into a clean markdown table."

--- 3. KEY TOPICS & RECURRING THEMES ---
"What are the top 5 most frequent discussion topics and recurring conversational themes across these transcripts? Include a short summary of each participant's perspective."

--- 4. INSIDE JOKES & MEMORABLE QUOTES ---
"Identify memorable quotes, inside jokes, nicknames, and funny moments shared between ${participantList}. Cite the exact date and context for each quote."

--- 5. YEAR-OVER-YEAR COMPARISON (If split into Yearly sources) ---
"Compare the main activities and overall vibe discussed in the earlier archives versus the recent ones. How did topics and shared interests evolve over time?"

--- 6. VACATION & TRIP ITINERARIES ---
"List every vacation, trip, road trip, or outing planned or discussed in these transcripts. Detail where they went, dates mentioned, and highlights of the trip."
`;
}

/**
 * Generates a master combined document containing multiple threads
 */
export function generateMasterCombinedExport(
  threads: ConversationThread[],
  options: Partial<ExportOptions> = {}
): string {
  const selectedThreads = threads.filter(t => t.selected);
  const format = options.format || 'markdown';

  if (format === 'markdown') {
    const sections: string[] = [];
    sections.push(`# Master Messenger Export Archive`);
    sections.push(`*Generated on ${new Date().toLocaleString()}*`);
    sections.push(`*Total Threads: ${selectedThreads.length}*`);
    sections.push('');
    sections.push('## Table of Contents');
    selectedThreads.forEach((t, i) => {
      sections.push(`${i + 1}. [${t.title || t.baseId}](#thread-${i + 1}) (${t.totalMessages} msgs)`);
    });
    sections.push('');
    sections.push('---');
    sections.push('');

    selectedThreads.forEach((thread, idx) => {
      sections.push(`<a id="thread-${idx + 1}"></a>`);
      sections.push(generateThreadMarkdown(thread, options));
      sections.push('');
      sections.push('---');
      sections.push('');
    });

    return sections.join('\n');
  } else {
    // Master HTML
    const threadHtmlSections = selectedThreads.map(thread => {
      return generateThreadHTML(thread, options);
    });
    return threadHtmlSections.join('\n<div style="page-break-after: always; margin: 40px 0; border-top: 4px dashed #0055ea;"></div>\n');
  }
}

/**
 * Creates a downloadable ZIP archive containing all selected threads as individual files (with optional time chunking)
 */
export async function createBatchExportZip(
  threads: ConversationThread[],
  options: Partial<ExportOptions> = {},
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const selectedThreads = threads.filter(t => t.selected);
  const format = options.format || 'markdown';
  const ext = format === 'markdown' ? 'md' : 'html';
  const timeChunking = options.timeChunking || 'none';

  const folder = zip.folder('messenger_archives') || zip;
  let totalFilesWritten = 0;
  const manifestEntries: string[] = [];

  selectedThreads.forEach((thread) => {
    const safeTitle = (thread.title || thread.baseId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'conversation';

    if (timeChunking !== 'none') {
      // Split into time chunks (Yearly, Quarterly, Monthly)
      const chunks = splitThreadByTimeChunk(thread, options);
      chunks.forEach(chunk => {
        if (chunk.messages.length === 0) return;
        const chunkFilename = `${safeTitle}_${chunk.chunkKey}.${ext}`;
        const content = format === 'markdown'
          ? generateThreadMarkdown(thread, options, chunk.messages, chunk.label)
          : generateThreadHTML(thread, options, chunk.messages, chunk.label);

        folder.file(chunkFilename, content);
        totalFilesWritten++;
        manifestEntries.push(`- ${chunkFilename}: ${chunk.label} (${chunk.messages.length} messages)`);
      });
    } else {
      // Single unified file for this thread
      const filename = `${safeTitle}_archive.${ext}`;
      const content = format === 'markdown'
        ? generateThreadMarkdown(thread, options)
        : generateThreadHTML(thread, options);

      folder.file(filename, content);
      totalFilesWritten++;
      manifestEntries.push(`- ${filename}: ${thread.title || thread.baseId} (${thread.totalMessages} messages)`);
    }
  });

  // Prompt starters for NotebookLM
  if (options.includePromptStarters !== false) {
    const promptsContent = generateNotebookLMPrompts(selectedThreads);
    folder.file('NOTEBOOKLM_PROMPT_STARTERS.txt', promptsContent);
  }

  // Also include a manifest / README
  const manifest = `# Messenger Archive Batch Export (NotebookLM Optimized)
Total Conversations Processed: ${selectedThreads.length}
Total Files Generated: ${totalFilesWritten}
Export Format: ${format.toUpperCase()}
Time Chunking Strategy: ${timeChunking.toUpperCase()}
Consecutive Messages Merged: ${options.mergeConsecutiveMessages ? 'YES' : 'NO'}
Generated: ${new Date().toISOString()}

Included Files & Slices:
${manifestEntries.join('\n')}
`;
  folder.file('ARCHIVE_INDEX.txt', manifest);

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    metadata => {
      onZipProgress?.(Math.round(metadata.percent));
    }
  );

  return zipBlob;
}

/**
 * Triggers a browser download of a Blob or text content
 */
export function downloadFile(content: Blob | string, filename: string, mimeType = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

