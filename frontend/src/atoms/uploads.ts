import { atom } from 'jotai';

export interface UploadJob {
  jobId: string;
  filename: string;
  status: string;
  thumbnailUrl?: string;
  error?: string;
}

export const uploadsAtom = atom<UploadJob[]>([]);
