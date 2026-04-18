import mongoose, { Schema, Document } from 'mongoose';
import type { IocType } from './IocCache';

export interface IocHistoryMetadata {
  filename?: string;
  filesize?: number;
  filetype?: string;
}

export interface IIocUserHistory extends Document {
  userId: string;
  value: string;
  type: IocType;
  searched_at: Date;
  verdict?: string;
  label?: string;
  source?: string;
  metadata?: IocHistoryMetadata | null;
}

const metadataSchema = new Schema<IocHistoryMetadata>(
  {
    filename: { type: String },
    filesize: { type: Number },
    filetype: { type: String },
  },
  { _id: false }
);

const iocUserHistorySchema = new Schema<IIocUserHistory>(
  {
    userId: { type: String, required: true, index: true },
    value: { type: String, required: true },
    type: { type: String, required: true, enum: ['ip', 'domain', 'url', 'hash'] },
    searched_at: { type: Date, default: Date.now },
    verdict: { type: String, default: null },
    label: { type: String, default: null },
    source: { type: String, default: null },
    metadata: { type: metadataSchema, default: null },
  },
  { timestamps: false }
);

iocUserHistorySchema.index({ userId: 1, searched_at: -1 });

export const IocUserHistory =
  mongoose.models.IocUserHistory ||
  mongoose.model<IIocUserHistory>('IocUserHistory', iocUserHistorySchema);
