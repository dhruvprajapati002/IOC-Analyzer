import mongoose, { Schema, Document } from 'mongoose';

export type IocType = 'ip' | 'domain' | 'url' | 'hash';

export interface IThreatIntelBasic {
  threatTypes: string[];
  confidence: number;
}

export interface IIocCache extends Document {
  value: string;
  type: IocType;
  verdict: string;
  severity: string;
  riskScore: number;
  threatIntel: IThreatIntelBasic;
  analysis?: unknown;
  created_at: Date;
  expiresAt: Date;
}

const threatIntelSchema = new Schema<IThreatIntelBasic>(
  {
    threatTypes: { type: [String], default: [] },
    confidence: { type: Number, default: 0 },
  },
  { _id: false }
);

const iocCacheSchema = new Schema<IIocCache>(
  {
    value: { type: String, required: true },
    type: { type: String, required: true, enum: ['ip', 'domain', 'url', 'hash'] },
    verdict: { type: String, default: 'unknown' },
    severity: { type: String, default: 'unknown' },
    riskScore: { type: Number, default: 0 },
    threatIntel: { type: threatIntelSchema, default: () => ({}) },
    analysis: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false }
);

iocCacheSchema.index({ value: 1, type: 1 }, { unique: true });
iocCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IocCache =
  mongoose.models.IocCache || mongoose.model<IIocCache>('IocCache', iocCacheSchema);
