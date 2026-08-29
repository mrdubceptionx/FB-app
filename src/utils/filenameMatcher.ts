/**
 * Utility functions for parsing file names and paths to extract
 * conversation identifiers, folder groupings, and part numbers.
 */

export interface ExtractedInfo {
  baseId: string;
  partNumber: number;
  displayName: string;
  folderName: string;
}

/**
 * Extracts conversation base ID and part number from filename and relative path.
 * Examples:
 * - "mariannecarmenperli_3818328304870619_message_1.html" -> base: "mariannecarmenperli_3818328304870619", part: 1
 * - "your_facebook_activity/messages/inbox/johndoe_12345/message_2.html" -> base: "johndoe_12345", part: 2
 * - "chat-thread-part-3.html" -> base: "chat-thread", part: 3
 * - "alice_bob_1.html" -> base: "alice_bob", part: 1
 */
export function extractConversationInfo(filePath: string, fileName: string): ExtractedInfo {
  // Normalize slashes
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/').filter(Boolean);
  
  // Remove .html / .htm extension
  const cleanFileName = fileName.replace(/\.html?$/i, '');
  
  let baseId = '';
  let partNumber = 1;
  let folderName = '';

  // Check if inside a folder like "messages/inbox/<conv_id>/message_1.html"
  if (pathParts.length >= 2) {
    const parentFolder = pathParts[pathParts.length - 2];
    folderName = parentFolder;

    // Check if filename itself is just "message_1" or "message-1" inside a parent folder
    const simplePartMatch = cleanFileName.match(/^message[_-]?(\d+)$/i);
    if (simplePartMatch) {
      partNumber = parseInt(simplePartMatch[1], 10);
      baseId = parentFolder;
    }
  }

  // If baseId not determined from folder structure, extract from filename
  if (!baseId) {
    // Patterns like "name_id_message_1", "name_id-message-2", "name_message_1"
    const messagePartMatch = cleanFileName.match(/^(.*?)[_-]message[_-](\d+)$/i);
    if (messagePartMatch) {
      baseId = messagePartMatch[1];
      partNumber = parseInt(messagePartMatch[2], 10);
    } else {
      // Patterns like "name_id_part_1", "name-part-1"
      const partMatch = cleanFileName.match(/^(.*?)[_-]part[_-]?(\d+)$/i);
      if (partMatch) {
        baseId = partMatch[1];
        partNumber = parseInt(partMatch[2], 10);
      } else {
        // Patterns like "name_id_1" or "name-1" where ending is a digit
        const trailingDigitMatch = cleanFileName.match(/^(.*?)[_-](\d+)$/i);
        if (trailingDigitMatch && trailingDigitMatch[2].length <= 3) {
          baseId = trailingDigitMatch[1];
          partNumber = parseInt(trailingDigitMatch[2], 10);
        } else {
          // No part number detected
          baseId = cleanFileName;
          partNumber = 1;
        }
      }
    }
  }

  // Cleanup baseId
  baseId = baseId.trim();
  if (!baseId) {
    baseId = cleanFileName || 'unknown_conversation';
  }

  // Create friendly display name from baseId
  const displayName = formatDisplayName(baseId);

  return {
    baseId,
    partNumber,
    displayName,
    folderName,
  };
}

/**
 * Creates human-readable display name from identifier
 * e.g. "mariannecarmenperli_3818328304870619" -> "Marianne Carmen Perli"
 */
export function formatDisplayName(baseId: string): string {
  // Strip trailing numeric Facebook IDs (e.g. "_3818328304870619" or "-123456789")
  let clean = baseId.replace(/[-_]\d{6,}$/, '');
  
  // If snake_case, replace underscores with spaces
  clean = clean.replace(/_/g, ' ').replace(/-/g, ' ');

  // Insert space before capital letters if camelCase / PascalCase
  clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Title case each word if all lowercase
  if (clean === clean.toLowerCase()) {
    clean = clean
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return clean.trim() || baseId;
}
