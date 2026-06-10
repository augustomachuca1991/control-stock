import { create } from 'zustand'
import type { Backup } from '../types'

interface BackupState {
  backups: Backup[]
  addBackup: (backup: Backup) => void
  deleteBackup: (id: string) => void
}

export const useBackupStore = create<BackupState>((set) => ({
  backups: [],
  addBackup: (backup) =>
    set((state) => ({ backups: [backup, ...state.backups] })),
  deleteBackup: (id) =>
    set((state) => ({ backups: state.backups.filter((b) => b.id !== id) })),
}))
