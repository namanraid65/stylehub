import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Settings groups ──────────────────────────────────────────────────────────
export type SettingsGroup =
  | 'general'
  | 'payment'
  | 'shipping'
  | 'email'
  | 'seo'
  | 'social'
  | 'vendor'
  | 'security';

export type SettingsValueType = 'string' | 'number' | 'boolean' | 'json' | 'array';

export interface ISettingsDoc extends Document {
  key:          string;
  value:        unknown;
  type:         SettingsValueType;
  label:        string;
  description?: string;
  group:        SettingsGroup;
  isPublic:     boolean;   // If true, exposed to unauthenticated frontend
  updatedBy?:   mongoose.Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

export interface ISettingsModel extends Model<ISettingsDoc> {
  getValue<T = unknown>(key: string): Promise<T | null>;
  getGroup(group: SettingsGroup): Promise<Record<string, unknown>>;
  setValue(key: string, value: unknown, userId?: string): Promise<ISettingsDoc>;
}

const SettingsSchema = new Schema<ISettingsDoc, ISettingsModel>(
  {
    key: {
      type: String,
      required: [true, 'Settings key is required'],
      unique: true,
      trim: true,
      match: [/^[a-z][a-z0-9_.]*$/, 'Key must be lowercase alphanumeric with dots/underscores'],
    },
    value:    { type: Schema.Types.Mixed, required: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json', 'array'],
      default: 'string',
    },
    label:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    group: {
      type: String,
      enum: ['general', 'payment', 'shipping', 'email', 'seo', 'social', 'vendor', 'security'],
      default: 'general',
    },
    isPublic:  { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
SettingsSchema.index({ key: 1 }, { unique: true });
SettingsSchema.index({ group: 1, isPublic: 1 });

// ─── Static methods ───────────────────────────────────────────────────────────
SettingsSchema.statics.getValue = async function <T>(this: any, key: string): Promise<T | null> {
  const doc = await this.findOne({ key }).lean();
  return doc ? (doc.value as T) : null;
};

SettingsSchema.statics.getGroup = async function (
  this: any,
  group: SettingsGroup,
): Promise<Record<string, unknown>> {
  const docs = await this.find({ group }).lean();
  return docs.reduce((acc: Record<string, unknown>, doc: any) => {
    acc[doc.key] = doc.value;
    return acc;
  }, {});
};

SettingsSchema.statics.setValue = async function (
  this: any,
  key: string,
  value: unknown,
  userId?: string,
): Promise<ISettingsDoc> {
  const doc = await this.findOneAndUpdate(
    { key },
    { value, ...(userId && { updatedBy: userId }) },
    { new: true, upsert: false, runValidators: true },
  );
  if (!doc) throw new Error(`Setting key '${key}' not found.`);
  return doc;
};

const Settings = mongoose.model<ISettingsDoc, ISettingsModel>('Settings', SettingsSchema);
export default Settings;
