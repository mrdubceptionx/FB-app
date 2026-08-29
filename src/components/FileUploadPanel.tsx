import React, { useRef, useState } from 'react';
import { FolderUp, UploadCloud, Archive, Sparkles, FileText, CheckCircle } from 'lucide-react';
import { ParsingProgress } from '../types';
import { XPProgressBar } from './XPProgressBar';

interface FileUploadPanelProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onZipSelected: (file: File) => void;
  onLoadSample: () => void;
  progress: ParsingProgress;
  isProcessing: boolean;
  totalLoadedFiles: number;
  totalThreads: number;
}

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({
  onFilesSelected,
  onZipSelected,
  onLoadSample,
  progress,
  isProcessing,
  totalLoadedFiles,
  totalThreads,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
      onZipSelected(files[0]);
      return;
    }

    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div className="p-3 bg-[#ece9d8]">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={e => e.target.files && onFilesSelected(e.target.files)}
        {...{ webkitdirectory: '', directory: '' }}
        multiple
        className="hidden"
        id="folder-input"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => e.target.files && onFilesSelected(e.target.files)}
        accept=".html,.htm"
        multiple
        className="hidden"
        id="files-input"
      />
      <input
        type="file"
        ref={zipInputRef}
        onChange={e => e.target.files?.[0] && onZipSelected(e.target.files[0])}
        accept=".zip"
        className="hidden"
        id="zip-input"
      />

      {/* Main Drag & Drop / Action Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`xp-inset p-4 transition-all ${
          isDragOver ? 'bg-[#eaf2fd] border-[#0055ea]' : 'bg-[#faf9f5]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Icon & Text */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#e8eef8] border border-[#7f9db9] flex items-center justify-center shadow-inner">
              <UploadCloud className="w-6 h-6 text-[#0055ea]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#003399]">
                Drop Messenger Export Files, Folder, or ZIP Here
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                Processes split multi-part archives (e.g. <span className="font-mono bg-gray-100 px-1 py-0.5 border text-gray-800">_message_1.html</span>, <span className="font-mono bg-gray-100 px-1 py-0.5 border text-gray-800">_message_2.html</span>)
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dropzone-btn-folder"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="xp-button flex items-center gap-1.5 py-1.5 px-3 font-semibold"
            >
              <FolderUp className="w-4 h-4 text-[#d48800]" />
              <span>Select Folder</span>
            </button>

            <button
              id="dropzone-btn-zip"
              onClick={() => zipInputRef.current?.click()}
              disabled={isProcessing}
              className="xp-button flex items-center gap-1.5 py-1.5 px-3 font-semibold"
            >
              <Archive className="w-4 h-4 text-[#9933cc]" />
              <span>Open .ZIP</span>
            </button>

            <button
              id="dropzone-btn-files"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="xp-button flex items-center gap-1.5 py-1.5 px-3"
            >
              <FileText className="w-4 h-4 text-[#0055ea]" />
              <span>HTML Files</span>
            </button>

            <button
              id="dropzone-btn-sample"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="xp-button xp-button-primary flex items-center gap-1.5 py-1.5 px-3 bg-[#fff7d6] text-[#003399]"
            >
              <Sparkles className="w-4 h-4 text-[#e6a100]" />
              <span>Test with Sample Data</span>
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar during Parsing / Decompression */}
        {isProcessing && (
          <div className="mt-4 pt-3 border-t border-[#aca899]">
            <XPProgressBar
              percentage={progress.percentage}
              label={
                progress.status === 'reading_zip'
                  ? 'Decompressing ZIP Archive...'
                  : progress.status === 'parsing_files'
                  ? 'Parsing HTML Files & Extracting Messages...'
                  : progress.status === 'grouping'
                  ? 'Stitching & Sorting Conversations...'
                  : 'Processing...'
              }
              statusText={progress.detailMessage}
            />
          </div>
        )}

        {/* Loaded Dataset Status Badge */}
        {!isProcessing && totalLoadedFiles > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#dcd8c8] flex flex-wrap items-center justify-between text-[11px] text-gray-700">
            <div className="flex items-center gap-1.5 text-[#006600] font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Loaded {totalLoadedFiles} HTML files across {totalThreads} conversation threads.</span>
            </div>
            <div className="text-gray-500 italic">
              All files processed locally in-browser. Zero data leaves your computer.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
