import JSZip from 'jszip';
import { RawFile, ParsingProgress } from '../types';

/**
 * Reads a ZIP file and extracts all HTML files contained within it.
 */
export async function readZipFile(
  file: File,
  onProgress?: (progress: ParsingProgress) => void
): Promise<RawFile[]> {
  onProgress?.({
    status: 'reading_zip',
    currentFile: file.name,
    processedCount: 0,
    totalCount: 100,
    percentage: 0,
    detailMessage: `Opening ZIP archive: ${file.name}...`,
  });

  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  const htmlEntries: { path: string; entry: JSZip.JSZipObject }[] = [];

  zipContent.forEach((relativePath, entry) => {
    if (!entry.dir && /\.(html|htm)$/i.test(entry.name)) {
      htmlEntries.push({ path: relativePath, entry });
    }
  });

  const totalHtml = htmlEntries.length;
  if (totalHtml === 0) {
    throw new Error('No HTML files (.html or .htm) found in this ZIP archive.');
  }

  const rawFiles: RawFile[] = [];
  let completed = 0;

  for (const item of htmlEntries) {
    const content = await item.entry.async('text');
    const fileName = item.path.split('/').pop() || item.path;

    rawFiles.push({
      name: fileName,
      path: item.path,
      content,
      size: item.entry.comment?.length || content.length,
      lastModified: item.entry.date ? item.entry.date.getTime() : Date.now(),
    });

    completed++;
    const pct = Math.round((completed / totalHtml) * 100);

    if (completed % 10 === 0 || completed === totalHtml) {
      onProgress?.({
        status: 'reading_zip',
        currentFile: item.path,
        processedCount: completed,
        totalCount: totalHtml,
        percentage: pct,
        detailMessage: `Extracted ${completed} of ${totalHtml} HTML files from ZIP archive...`,
      });
      // Yield to let UI repaint
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return rawFiles;
}
