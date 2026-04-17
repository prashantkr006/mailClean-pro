import React from 'react';
import { Trash2, UserX } from 'lucide-react';
import type { EmailSummary } from '@/types/domain';
import { CATEGORIES } from '@/types/domain';
import { formatRelativeDate, truncate } from '@/utils/format';

interface EmailCardProps {
  email: EmailSummary;
  isSelected: boolean;
  onToggleSelect: () => void;
  onTrash: () => void;
}

export function EmailCard({ email, isSelected, onToggleSelect, onTrash }: EmailCardProps) {
  const handleUnsubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: 'UNSUBSCRIBE', messageId: email.id });
  };

  return (
    <div
      className={`p-4 hover:bg-paper cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
      onClick={onToggleSelect}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-ink text-sm truncate">
              {email.subject || '(no subject)'}
            </span>
            {email.isUnread && (
              <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Unread
              </span>
            )}
          </div>

          <p className="text-xs text-ink-muted mb-1.5">
            {email.fromName || email.fromDomain} · {formatRelativeDate(email.date)}
          </p>

          <p className="text-sm text-ink-soft leading-snug mb-2">
            {truncate(email.snippet, 120)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {email.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: CATEGORIES[category].color + '18',
                    color: CATEGORIES[category].color,
                  }}
                >
                  {CATEGORIES[category].label}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {email.listUnsubscribeHeader && (
                <button
                  onClick={handleUnsubscribe}
                  className="p-1.5 text-ink-muted hover:text-ink-soft rounded"
                  title="Unsubscribe"
                >
                  <UserX size={15} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onTrash(); }}
                className="p-1.5 text-ink-muted hover:text-red-600 rounded"
                title="Trash"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
