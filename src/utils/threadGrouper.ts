import { RawFile, ConversationThread, FilePart, ParsedMessage, ParsingProgress } from '../types';
import { extractConversationInfo } from './filenameMatcher';
import { parseMessengerHTML } from './htmlParser';

/**
 * Groups multiple raw HTML files into unified ConversationThread objects,
 * parsing them asynchronously in chunks to prevent UI freezes.
 */
export async function processAndGroupFiles(
  files: RawFile[],
  onProgress?: (progress: ParsingProgress) => void
): Promise<ConversationThread[]> {
  const totalCount = files.length;
  if (totalCount === 0) return [];

  onProgress?.({
    status: 'parsing_files',
    currentFile: '',
    processedCount: 0,
    totalCount,
    percentage: 0,
    detailMessage: `Preparing to process ${totalCount} files...`,
  });

  // Intermediate map of baseId -> list of FileParts
  const threadsMap = new Map<
    string,
    {
      baseId: string;
      title: string;
      participants: Set<string>;
      generatedBy?: string;
      generationDate?: string;
      parts: FilePart[];
    }
  >();

  const CHUNK_SIZE = 15; // Process in small chunks with yielding
  let processed = 0;

  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE);

    for (const file of chunk) {
      const { baseId, partNumber, displayName } = extractConversationInfo(file.path, file.name);
      const parseResult = parseMessengerHTML(file.content, file.name, partNumber);

      // Determine date range for this part
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      for (const msg of parseResult.messages) {
        if (msg.timestamp) {
          if (!startDate || msg.timestamp < startDate) startDate = msg.timestamp;
          if (!endDate || msg.timestamp > endDate) endDate = msg.timestamp;
        }
      }

      const filePart: FilePart = {
        id: `${baseId}_part_${partNumber}_${file.name}`,
        fileName: file.name,
        filePath: file.path,
        partNumber,
        fileSize: file.size,
        messageCount: parseResult.messages.length,
        dateRange: { start: startDate, end: endDate },
        selected: true,
        messages: parseResult.messages,
        parseError: parseResult.error,
      };

      if (!threadsMap.has(baseId)) {
        threadsMap.set(baseId, {
          baseId,
          title: parseResult.title || displayName,
          participants: new Set(parseResult.participants),
          generatedBy: parseResult.generatedBy,
          generationDate: parseResult.generationDate,
          parts: [filePart],
        });
      } else {
        const threadData = threadsMap.get(baseId)!;
        // Merge participants
        parseResult.participants.forEach(p => threadData.participants.add(p));
        // Prefer explicit parsed title over default display name
        if (parseResult.title && (!threadData.title || threadData.title === displayName)) {
          threadData.title = parseResult.title;
        }
        if (!threadData.generatedBy && parseResult.generatedBy) {
          threadData.generatedBy = parseResult.generatedBy;
          threadData.generationDate = parseResult.generationDate;
        }
        threadData.parts.push(filePart);
      }

      processed++;
    }

    const pct = Math.round((processed / totalCount) * 100);
    onProgress?.({
      status: 'parsing_files',
      currentFile: chunk[chunk.length - 1]?.name || '',
      processedCount: processed,
      totalCount,
      percentage: pct,
      detailMessage: `Parsed ${processed} of ${totalCount} files (${pct}%)`,
    });

    // Yield control to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  onProgress?.({
    status: 'grouping',
    currentFile: '',
    processedCount: totalCount,
    totalCount,
    percentage: 100,
    detailMessage: 'Assembling conversation threads & chronological ordering...',
  });

  // Final Assembly into ConversationThread objects
  const results: ConversationThread[] = [];

  for (const [baseId, threadData] of threadsMap.entries()) {
    // Sort parts: if part numbers are valid, sort by partNumber ascending
    threadData.parts.sort((a, b) => a.partNumber - b.partNumber);

    // Calculate total messages and date span
    let totalMessages = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const part of threadData.parts) {
      totalMessages += part.messageCount;
      if (part.dateRange.start) {
        if (!minDate || part.dateRange.start < minDate) minDate = part.dateRange.start;
      }
      if (part.dateRange.end) {
        if (!maxDate || part.dateRange.end > maxDate) maxDate = part.dateRange.end;
      }
    }

    results.push({
      id: baseId,
      baseId,
      title: threadData.title || baseId,
      participants: Array.from(threadData.participants),
      generatedBy: threadData.generatedBy,
      generationDate: threadData.generationDate,
      parts: threadData.parts,
      selected: true,
      totalMessages,
      dateRange: { start: minDate, end: maxDate },
    });
  }

  // Sort threads by total messages descending (most active first) or title
  results.sort((a, b) => b.totalMessages - a.totalMessages);

  onProgress?.({
    status: 'complete',
    currentFile: '',
    processedCount: totalCount,
    totalCount,
    percentage: 100,
    detailMessage: `Successfully assembled ${results.length} conversation threads across ${totalCount} files.`,
  });

  return results;
}

/**
 * Stitches messages from selected parts of a conversation thread into a single,
 * deduplicated, sorted message stream.
 */
export function getStitchedMessages(
  thread: ConversationThread,
  sortOrder: 'asc' | 'desc' = 'asc'
): ParsedMessage[] {
  const selectedParts = thread.parts.filter(p => p.selected);
  const allMessages: ParsedMessage[] = [];
  const seenKey = new Set<string>();

  for (const part of selectedParts) {
    for (const msg of part.messages) {
      // Deduplication key: sender + timestamp-or-raw + first 60 chars of content
      const timeKey = msg.timestamp ? msg.timestamp.toISOString() : msg.rawTimestamp;
      const snippet = (msg.content || '').slice(0, 60);
      const photoKey = msg.photos.join(',');
      const dedupKey = `${msg.sender}_${timeKey}_${snippet}_${photoKey}`;

      if (!seenKey.has(dedupKey)) {
        seenKey.add(dedupKey);
        allMessages.push(msg);
      }
    }
  }

  // Sort messages
  allMessages.sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return sortOrder === 'asc' ? diff : -diff;
    }
    // Fallback if one lacks date: preserve original part order
    const partDiff = a.sourcePartNumber - b.sourcePartNumber;
    return sortOrder === 'asc' ? partDiff : -partDiff;
  });

  return allMessages;
}
