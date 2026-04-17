import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatBytes, formatNumber } from '@/utils/format';

interface Props {
  count: number;
  storageBytes: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmTrashModal({ count, storageBytes, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-ink text-lg">Move to Trash?</h2>
            <p className="text-ink-muted text-sm">This cannot be undone from MailClean Pro.</p>
          </div>
        </div>

        <div className="bg-paper rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Emails to trash</span>
            <span className="font-semibold text-ink">{formatNumber(count)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Storage reclaimed</span>
            <span className="font-semibold text-accent-keep">~{formatBytes(storageBytes)}</span>
          </div>
        </div>

        <p className="text-xs text-ink-muted mb-6">
          Emails are moved to Trash, not permanently deleted. You can recover them from Gmail's
          Trash within 30 days.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white text-sm font-medium h-10 px-4 hover:bg-red-700 transition-colors"
          >
            <Trash2 size={15} />
            Trash {formatNumber(count)} emails
          </button>
        </div>
      </div>
    </div>
  );
}
