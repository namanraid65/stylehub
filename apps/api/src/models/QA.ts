import mongoose, { Schema, Document } from 'mongoose';

export interface IQADoc extends Document {
  product:       mongoose.Types.ObjectId;
  vendor:        mongoose.Types.ObjectId;
  question:      string;
  askedBy?:      mongoose.Types.ObjectId;
  askedByName:   string;
  askedByEmail:  string;
  answer?:       string;
  answeredBy?:   mongoose.Types.ObjectId;
  answeredAt?:   Date;
  isPublished:   boolean;
  helpfulCount:  number;
  createdAt:     Date;
  updatedAt:     Date;
}

const QASchema = new Schema<IQADoc>(
  {
    product:      { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendor:       { type: Schema.Types.ObjectId, ref: 'Vendor',  required: true },
    question:     { type: String, required: true, trim: true, maxlength: 500 },
    askedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
    askedByName:  { type: String, required: true, trim: true },
    askedByEmail: { type: String, required: true, lowercase: true, trim: true },
    answer:       { type: String, trim: true, maxlength: 2000 },
    answeredBy:   { type: Schema.Types.ObjectId, ref: 'User' },
    answeredAt:   { type: Date },
    isPublished:  { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

QASchema.index({ product: 1, isPublished: 1, createdAt: -1 });
QASchema.index({ vendor: 1 });

const QA = mongoose.model<IQADoc>('QA', QASchema);
export default QA;
