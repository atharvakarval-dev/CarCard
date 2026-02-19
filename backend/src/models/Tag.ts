import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
    code: string;
    userId: mongoose.Types.ObjectId;
    nickname: string;
    type: 'car' | 'bike' | 'business' | 'other';
    plateNumber?: string;
    isActive: boolean;
    privacy: {
        allowMaskedCall: boolean;
        allowWhatsapp: boolean;
        allowSms: boolean;
        showEmergencyContact: boolean;
    };
    emergencyContact?: {
        name: string;
        phone: string;
    };
    scans: {
        location?: string;
        timestamp: Date;
    }[];
    vehicleDetails?: {
        color?: string;
        make?: string;
        model?: string;
    };
}

const TagSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    nickname: { type: String, required: true },
    type: { type: String, enum: ['car', 'bike', 'business', 'other'], default: 'car' },
    plateNumber: { type: String },
    isActive: { type: Boolean, default: true },
    privacy: {
        allowMaskedCall: { type: Boolean, default: true },
        allowWhatsapp: { type: Boolean, default: true },
        allowSms: { type: Boolean, default: true },
        showEmergencyContact: { type: Boolean, default: false },
    },
    emergencyContact: {
        name: String,
        phone: String,
    },
    scans: [{
        location: String,
        timestamp: { type: Date, default: Date.now },
    }],
    vehicleDetails: {
        color: String,
        make: String,
        model: String,
    },
}, { timestamps: true });

export default mongoose.model<ITag>('Tag', TagSchema);
