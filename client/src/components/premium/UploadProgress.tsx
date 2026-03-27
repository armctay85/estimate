import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

interface UploadProgressProps {
  files: UploadFile[];
  onCancel?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  compact?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const statusConfig = {
  uploading: { 
    icon: Upload, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    label: 'Uploading...'
  },
  processing: { 
    icon: Loader2, 
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    label: 'Processing...'
  },
  complete: { 
    icon: CheckCircle, 
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: 'Complete'
  },
  error: { 
    icon: AlertCircle, 
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    label: 'Error'
  },
};

export function UploadProgress({
  files,
  onCancel,
  onRemove,
  onRetry,
  compact = false,
}: UploadProgressProps) {
  const [dismissedComplete, setDismissedComplete] = useState<Set<string>>(new Set());

  // Auto-dismiss completed uploads after 3 seconds
  useEffect(() => {
    files.forEach(file => {
      if (file.status === 'complete' && !dismissedComplete.has(file.id)) {
        const timer = setTimeout(() => {
          setDismissedComplete(prev => new Set(prev).add(file.id));
        }, 3000);
        return () => clearTimeout(timer);
      }
    });
  }, [files, dismissedComplete]);

  const visibleFiles = files.filter(f => !dismissedComplete.has(f.id));

  if (visibleFiles.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        {visibleFiles.map((file) => (
          <CompactUploadItem 
            key={file.id} 
            file={file}
            onCancel={onCancel}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Uploads ({visibleFiles.length})
        </h4>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleFiles.map((file) => (
          <UploadItem 
            key={file.id} 
            file={file}
            onCancel={onCancel}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function UploadItem({ 
  file, 
  onCancel, 
  onRemove, 
  onRetry 
}: { 
  file: UploadFile;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const config = statusConfig[file.status];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
    >
      {/* Icon */}
      <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${config.color}`}>
        {file.status === 'uploading' || file.status === 'processing' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {file.name}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${config.bgColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${file.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${config.color}`}>
            {config.label} {file.status === 'uploading' && `${file.progress}%`}
          </span>
          {file.error && (
            <span className="text-xs text-red-500">{file.error}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {(file.status === 'uploading' || file.status === 'processing') && onCancel && (
          <button
            onClick={() => onCancel(file.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {file.status === 'error' && onRetry && (
          <button
            onClick={() => onRetry(file.id)}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}

        {(file.status === 'complete' || file.status === 'error') && onRemove && (
          <button
            onClick={() => onRemove(file.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CompactUploadItem({ 
  file, 
  onCancel, 
  onRemove, 
  onRetry 
}: { 
  file: UploadFile;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const config = statusConfig[file.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
    >
      <div className={`${config.color}`}>
        {file.status === 'uploading' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Icon className="w-4 h-4" />
          </motion.div>
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </p>
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
          <div 
            className={`h-full rounded-full ${config.bgColor} transition-all duration-300`}
            style={{ width: `${file.progress}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-gray-500">{file.progress}%</span>
    </motion.div>
  );
}

// Empty state for drag & drop
export function UploadDropzone({ 
  isDragActive, 
  onClick 
}: { 
  isDragActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      animate={{
        scale: isDragActive ? 1.02 : 1,
        borderColor: isDragActive ? '#0066FF' : '#E5E7EB',
      }}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex flex-col items-center">
        <motion.div
          animate={{ 
            y: isDragActive ? -5 : 0,
            scale: isDragActive ? 1.1 : 1
          }}
          className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl mb-4"
        >
          <Upload className="w-8 h-8 text-blue-500" />
        </motion.div>
        
        <p className="font-medium text-gray-900 dark:text-white mb-1">
          {isDragActive ? 'Drop files here' : 'Upload your files'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Drag & drop or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Supports PDF, DWG, IFC, RVT up to 500MB
        </p>
      </div>
    </motion.div>
  );
}
