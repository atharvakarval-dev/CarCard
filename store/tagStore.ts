import { create } from 'zustand';
import api from '../services/api';
import { ENDPOINTS } from '../services/config';

export interface Tag {
    _id: string;
    id?: string;
    code: string;
    nickname: string;
    type: 'car' | 'bike' | 'business' | 'other';
    plateNumber: string;
    isActive: boolean;
    userId?: string;
    status?: 'created' | 'active' | 'disabled';
    vehicleColor?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    privacy: {
        allowMaskedCall: boolean;
        allowWhatsapp: boolean;
        allowSms: boolean;
        showEmergencyContact: boolean;
    };
    emergencyContact?: {
        name?: string;
        phone?: string;
    };
    scans: {
        timestamp: string;
        location: string;
    }[];
}

interface TagState {
    tags: Tag[];
    isLoading: boolean;
    error: string | null;

    fetchTags: () => Promise<void>;
    registerTag: (code: string, nickname: string, type: Tag['type'], plateNumber: string) => Promise<boolean>;
    activateTag: (code: string, nickname: string, type: Tag['type'], plateNumber: string) => Promise<boolean>;
    togglePrivacy: (tagId: string, setting: keyof Tag['privacy']) => Promise<void>;
    getPublicTag: (tagId: string) => Promise<any>;
    updateTag: (tagId: string, data: Partial<Tag> & Record<string, any>) => Promise<{ success: boolean; otpRequired?: boolean }>;
    sendTagOtp: (tagId: string, phoneNumber: string, pendingData: any) => Promise<boolean>;
    verifyTagOtpAndUpdate: (tagId: string, phoneNumber: string, otp: string, pendingData: any) => Promise<boolean>;
}

export const useTagStore = create<TagState>((set, get) => ({
    tags: [],
    isLoading: false,
    error: null,

    fetchTags: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(ENDPOINTS.TAGS);
            set({ tags: response.data || [], isLoading: false });
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 401) {
                // Not logged in — this is expected, not an error
                set({ tags: [], isLoading: false, error: null });
            } else {
                set({ tags: [], isLoading: false, error: 'Failed to load tags' });
            }
        }
    },

    registerTag: async (code, nickname, type, plateNumber) => {
        set({ isLoading: true });
        try {
            const response = await api.post(ENDPOINTS.TAGS, { code, nickname, type, plateNumber });
            set(state => ({ tags: [...state.tags, response.data], isLoading: false }));
            return true;
        } catch (error) {
            set({ isLoading: false, error: 'Failed to register tag' });
            return false;
        }
    },

    activateTag: async (code, nickname, type, plateNumber) => {
        set({ isLoading: true });
        try {
            const response = await api.post(ENDPOINTS.TAGS_ACTIVATE, { code, nickname, type, plateNumber });
            set(state => ({ tags: [...state.tags, response.data.tag], isLoading: false }));
            return true;
        } catch (error) {
            set({ isLoading: false });
            return false;
        }
    },

    togglePrivacy: async (tagId, setting) => {
        set(state => ({
            tags: state.tags.map(tag =>
                tag._id === tagId
                    ? { ...tag, privacy: { ...tag.privacy, [setting]: !tag.privacy[setting] } }
                    : tag
            ),
        }));
        try {
            await api.patch(ENDPOINTS.TAGS_PRIVACY(tagId), { setting });
        } catch (error) {
            set(state => ({
                tags: state.tags.map(tag =>
                    tag._id === tagId
                        ? { ...tag, privacy: { ...tag.privacy, [setting]: !tag.privacy[setting] } }
                        : tag
                ),
            }));
        }
    },

    getPublicTag: async (tagId: string) => {
        try {
            const response = await api.get(ENDPOINTS.TAGS_PUBLIC(tagId));
            return response.data;
        } catch (error) {
            return null;
        }
    },

    updateTag: async (tagId, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put(ENDPOINTS.TAGS_UPDATE(tagId), data);
            if (response.data.otpRequired) {
                set({ isLoading: false });
                return { success: false, otpRequired: true };
            }
            set(state => ({
                tags: state.tags.map(t => (t._id === tagId ? response.data.tag : t)),
                isLoading: false,
            }));
            return { success: true };
        } catch (error: any) {
            set({ isLoading: false, error: error.response?.data?.message || 'Failed to update tag' });
            return { success: false };
        }
    },

    sendTagOtp: async (tagId, phoneNumber, pendingData) => {
        try {
            await api.post(ENDPOINTS.TAGS_OTP_SEND(tagId), { phoneNumber, pendingData });
            return true;
        } catch (error) {
            return false;
        }
    },

    verifyTagOtpAndUpdate: async (tagId, phoneNumber, otp, pendingData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(ENDPOINTS.TAGS_OTP_VERIFY(tagId), { phoneNumber, otp, pendingData });
            set(state => ({
                tags: state.tags.map(t => (t._id === tagId ? response.data.tag : t)),
                isLoading: false,
            }));
            return true;
        } catch (error: any) {
            set({ isLoading: false, error: error.response?.data?.message || 'OTP verification failed' });
            return false;
        }
    },
}));
