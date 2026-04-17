import { create } from 'zustand';
import type { ScanSummary, EmailSummary } from '@/types/domain';

interface ScanStore {
  summary: ScanSummary | null;
  emails: EmailSummary[];
  isScanning: boolean;
  scanError: string | null;
  progress: { scanned: number; total: number; phase: string } | null;
  setSummary: (summary: ScanSummary | null) => void;
  setEmails: (emails: EmailSummary[]) => void;
  removeEmails: (ids: string[]) => void;
  setScanning: (scanning: boolean) => void;
  setScanError: (error: string | null) => void;
  setProgress: (progress: { scanned: number; total: number; phase: string } | null) => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  summary: null,
  emails: [],
  isScanning: false,
  scanError: null,
  progress: null,
  setSummary: (summary) => set({ summary }),
  setEmails: (emails) => set({ emails }),
  removeEmails: (ids) => set((state) => ({ emails: state.emails.filter((e) => !ids.includes(e.id)) })),
  setScanning: (scanning) => set({ isScanning: scanning }),
  setScanError: (scanError) => set({ scanError }),
  setProgress: (progress) => set({ progress }),
}));
