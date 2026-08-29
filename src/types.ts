export interface RawFile {
  name: string;
  path: string;
  content: string;
  size: number;
  lastModified?: number;
}

export interface MessageReaction {
  reaction: string;
  actor: string;
}

export interface ParsedMessage {
  id: string;
  sender: string;
  timestamp: Date | null;
  rawTimestamp: string;
  content: string;
  photos: string[];
  videos: string[];
  audio: string[];
  stickers: string[];
  reactions: MessageReaction[];
  isCall: boolean;
  callDuration?: string;
  sourceFile: string;
  sourcePartNumber: number;
}

export interface FilePart {
  id: string;
  fileName: string;
  filePath: string;
  partNumber: number;
  fileSize: number;
  messageCount: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  selected: boolean;
  messages: ParsedMessage[];
  parseError?: string;
}

export interface ConversationThread {
  id: string;
  baseId: string;
  title: string;
  participants: string[];
  generatedBy?: string;
  generationDate?: string;
  parts: FilePart[];
  selected: boolean;
  totalMessages: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface ParsingProgress {
  status: 'idle' | 'reading_zip' | 'parsing_files' | 'grouping' | 'exporting' | 'complete' | 'error';
  currentFile: string;
  processedCount: number;
  totalCount: number;
  percentage: number;
  detailMessage: string;
}

export interface ExportOptions {
  format: 'markdown' | 'html';
  bundleMode: 'individual_zip' | 'single_combined' | 'single_active';
  timeChunking: 'none' | 'yearly' | 'quarterly' | 'monthly';
  sortOrder: 'asc' | 'desc'; // asc = oldest to newest (recommended for archives), desc = newest to oldest
  groupByDay: boolean;
  includeReactions: boolean;
  includeMediaPlaceholders: boolean;
  includePartDividers: boolean;
  optimizeForNotebookLM: boolean;
  mergeConsecutiveMessages: boolean; // Merges rapid bursts from same speaker to save 30-40% token context
  includePromptStarters: boolean; // Adds a NOTEBOOK_PROMPTS.txt file with tailored queries
  timestampFormat: '24h' | '12h';
  customTitlePrefix?: string;
  dateFilterStart?: string; // YYYY-MM-DD
  dateFilterEnd?: string; // YYYY-MM-DD
}

export interface FilterState {
  searchQuery: string;
  hideEmpty: boolean;
  onlyMultiPart: boolean;
  selectedOnly: boolean;
}
