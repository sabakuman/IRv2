
import React from 'react';
import { MOUAttachment } from '../../types_mou';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import { FileText, Download, Trash2, File as FileIcon, Upload } from 'lucide-react';
import { Button } from '../ui/LayoutComponents';

interface MOUAttachmentsProps {
  attachments: MOUAttachment[];
  onUpload: (files: FileList | null) => void;
}

export const MOUAttachments: React.FC<MOUAttachmentsProps> = ({ attachments, onUpload }) => {
  const { t } = useLanguage();

  const getFileIcon = (type: string | null | undefined) => {
    if (!type) return <FileIcon className="text-gray-500" />;
    if (type.includes('pdf')) return <FileText className="text-red-500" />;
    if (type.includes('image')) return <FileIcon className="text-blue-500" />;
    return <FileIcon className="text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer group relative">
        <input 
          type="file" 
          multiple 
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => onUpload(e.target.files)}
        />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-primary" />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white">Upload Documents</h4>
          <p className="text-sm text-gray-400 mt-1">Drag and drop or click to browse (PDF, Images)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                {getFileIcon(file.file_type)}
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{file.file_name}</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Uploaded by {file.uploaded_by} on {format(new Date(file.uploaded_at), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={file.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
              >
                <Download size={18} />
              </a>
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-300">
            <FileIcon size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-[10px]">No attachments found</p>
          </div>
        )}
      </div>
    </div>
  );
};
