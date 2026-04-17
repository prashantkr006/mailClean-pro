import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Trash2 } from 'lucide-react';
import { useScanStore } from '@/stores/scanStore';
import { EmailCard } from './EmailCard';
import { CategoryFilter } from './CategoryFilter';
import { ConfirmTrashModal } from './ConfirmTrashModal';
import { Button } from '@/components/ui/Button';
import { formatBytes, formatNumber } from '@/utils/format';
import type { EmailSummary, Category, CleanupBucket } from '@/types/domain';
import { CATEGORIES } from '@/types/domain';

export function ReviewPanel() {
  const { summary, emails } = useScanStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedBucket, setSelectedBucket] = useState<CleanupBucket | 'all'>('recommended');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingTrash, setPendingTrash] = useState<{ ids: string[]; bytes: number } | null>(null);

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      if (selectedCategory !== 'all' && !email.categories.includes(selectedCategory)) return false;
      if (selectedBucket !== 'all' && email.cleanupBucket !== selectedBucket) return false;
      return true;
    });
  }, [emails, selectedCategory, selectedBucket]);

  // Per-category counts and storage for recommended emails
  const categoryStats = useMemo(() => {
    const recommended = emails.filter((e) => e.cleanupBucket === 'recommended');
    const stats: Record<string, { count: number; bytes: number }> = {};
    for (const email of recommended) {
      for (const cat of email.categories) {
        if (!stats[cat]) stats[cat] = { count: 0, bytes: 0 };
        stats[cat]!.count += 1;
        stats[cat]!.bytes += email.sizeEstimate;
      }
    }
    return stats;
  }, [emails]);

  const recommendedEmails = useMemo(
    () => emails.filter((e) => e.cleanupBucket === 'recommended'),
    [emails],
  );
  const totalRecommendedBytes = useMemo(
    () => recommendedEmails.reduce((s, e) => s + e.sizeEstimate, 0),
    [recommendedEmails],
  );

  const handleSelectAll = () => {
    if (selectedIds.size === filteredEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  const requestTrash = (ids: string[]) => {
    const bytes = emails
      .filter((e) => ids.includes(e.id))
      .reduce((s, e) => s + e.sizeEstimate, 0);
    setPendingTrash({ ids, bytes });
  };

  const confirmTrash = () => {
    if (!pendingTrash) return;
    const ids = pendingTrash.ids;
    chrome.runtime.sendMessage({ type: 'TRASH_EMAILS', ids });
    useScanStore.getState().removeEmails(ids);
    setSelectedIds(new Set());
    setPendingTrash(null);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (!summary) {
    return (
      <div className="text-center py-12 text-ink-muted">
        No scan data yet. Start a scan to review emails.
      </div>
    );
  }

  return (
    <div>
      {pendingTrash && (
        <ConfirmTrashModal
          count={pendingTrash.ids.length}
          storageBytes={pendingTrash.bytes}
          onConfirm={confirmTrash}
          onCancel={() => setPendingTrash(null)}
        />
      )}

      {/* Category summary cards */}
      {recommendedEmails.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-ink">
              Recommended for cleanup —{' '}
              <span className="text-accent-promo">{formatNumber(recommendedEmails.length)} emails</span>,{' '}
              <span className="text-ink-muted">{formatBytes(totalRecommendedBytes)}</span>
            </h3>
            <button
              onClick={() => requestTrash(recommendedEmails.map((e) => e.id))}
              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Trash2 size={14} />
              Clean All Recommended
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(categoryStats).map(([cat, stats]) => {
              const info = CATEGORIES[cat as Category];
              if (!info || stats.count === 0) return null;
              const catEmails = recommendedEmails.filter((e) => e.categories.includes(cat as Category));
              return (
                <div
                  key={cat}
                  className="bg-paper rounded-lg p-3 border border-paper-border cursor-pointer hover:border-ink-muted transition-colors"
                  onClick={() => {
                    setSelectedCategory(cat as Category);
                    setSelectedBucket('recommended');
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mb-2"
                    style={{ backgroundColor: info.color }}
                  />
                  <p className="text-sm font-medium text-ink">{info.label}</p>
                  <p className="text-lg font-bold text-ink mt-0.5">{formatNumber(stats.count)}</p>
                  <p className="text-xs text-ink-muted">{formatBytes(stats.bytes)}</p>
                  <button
                    className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestTrash(catEmails.map((em) => em.id));
                    }}
                  >
                    <Trash2 size={11} /> Clean
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {emails.length === 0 && (
        <div className="text-center py-12 text-ink-muted">
          No emails to review — your inbox looks clean!
        </div>
      )}

      {emails.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value as CleanupBucket | 'all')}
              className="px-3 py-2 border border-paper-border rounded-md text-sm text-ink"
            >
              <option value="all">All buckets</option>
              <option value="recommended">Recommended</option>
              <option value="review">Review</option>
              <option value="keep">Keep</option>
            </select>
          </div>

          {/* Bulk actions */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedIds.size === filteredEmails.length && filteredEmails.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
              <span className="text-sm text-ink-muted">
                {filteredEmails.length} emails
                {selectedIds.size > 0 && `, ${selectedIds.size} selected`}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => requestTrash(Array.from(selectedIds))}
                className="inline-flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
              >
                <Trash2 size={14} />
                Trash {formatNumber(selectedIds.size)}
              </button>
            )}
          </div>

          {filteredEmails.length === 0 ? (
            <div className="text-center py-10 text-ink-muted text-sm border border-paper-border rounded-lg">
              No emails match the current filters.
            </div>
          ) : (
            <div className="border border-paper-border rounded-lg overflow-hidden">
              <List
                height={Math.min(600, filteredEmails.length * 120)}
                itemCount={filteredEmails.length}
                itemSize={120}
                width="100%"
              >
                {({ index, style }) => {
                  const email = filteredEmails[index];
                  if (!email) return null;
                  return (
                    <div style={style} className="border-b border-paper-border last:border-b-0">
                      <EmailCard
                        email={email}
                        isSelected={selectedIds.has(email.id)}
                        onToggleSelect={() => toggleSelection(email.id)}
                        onTrash={() => requestTrash([email.id])}
                      />
                    </div>
                  );
                }}
              </List>
            </div>
          )}
        </>
      )}
    </div>
  );
}
