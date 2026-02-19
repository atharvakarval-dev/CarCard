import { create } from 'zustand';
import api from '../services/api';

export interface Tag {
    _id: string;
    code: string;
    nickname: string;
    type: 'car' | 'bike' | 'business' | 'other';
    plateNumber: string;
    isActive: boolean;
    userId?: string;
    status?: 'created' | 'active';
    privacy: {
        allowMaskedCall: boolean;
        allowWhatsapp: boolean;
        allowSms: boolean;
        showEmergencyContact: boolean;
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
}

// Mock Data
const MOCK_TAGS: Tag[] = [
    {
        _id: '1',
        code: 'TAG-123',
        nickname: 'My Swift',
        type: 'car',
        plateNumber: 'MH 12 AB 1234',
        isActive: true,
        privacy: {
            allowMaskedCall: true,
            allowWhatsapp: true,
            allowSms: true,
            showEmergencyContact: false,
        },
        scans: [
            { timestamp: new Date().toISOString(), location: 'Pune, India' },
        ],
    },
    {
        _id: '2',
        code: 'TAG-456',
        nickname: 'Office Bike',
        type: 'bike',
        plateNumber: 'MH 14 XY 9876',
        isActive: true,
        privacy: {
            allowMaskedCall: false,
            allowWhatsapp: true,
            allowSms: true,
            showEmergencyContact: true,
        },
        scans: [],
    },
];

export const useTagStore = create<TagState>((set, get) => ({
    tags: [],
    isLoading: false,
    error: null,

    fetchTags: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/tags');
            // If response.data is empty array, use mock for demo purposes if backend empty
            if (Array.isArray(response.data) && response.data.length === 0) {
                set({ tags: MOCK_TAGS, isLoading: false }); // Fallback to mock if empty
            } else {
                set({ tags: response.data, isLoading: false });
            }
        } catch (error) {
            console.log('Fetch tags failed, using mock data');
            set({ tags: MOCK_TAGS, isLoading: false }); // Fallback to mock on error
        }
    },

    registerTag: async (code, nickname, type, plateNumber) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/tags', { code, nickname, type, plateNumber });
            const newTag = response.data;

            set(state => ({ tags: [...state.tags, newTag], isLoading: false }));
            return true;
        } catch (error) {
            set({ isLoading: false, error: 'Failed to register tag' });
            return false;
        }
    },

    activateTag: async (code: string, nickname: string, type: Tag['type'], plateNumber: string) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/tags/activate', { code, nickname, type, plateNumber });
            const newTag = response.data.tag;

            set(state => ({ tags: [...state.tags, newTag], isLoading: false }));
            return true;
        } catch (error) {
            // Don't set global error here to allow fallback to register
            set({ isLoading: false });
            return false;
        }
    },

    togglePrivacy: async (tagId, setting) => {
        // Optimistic update
        set(state => ({
            tags: state.tags.map(tag =>
                tag._id === tagId
                    ? { ...tag, privacy: { ...tag.privacy, [setting]: !tag.privacy[setting] } }
                    : tag
            )
        }));

        try {
            await api.patch(`/tags/${tagId}/privacy`, { setting });
        } catch (error) {
            // Revert if failed
            set(state => ({
                tags: state.tags.map(tag =>
                    tag._id === tagId
                        ? { ...tag, privacy: { ...tag.privacy, [setting]: !tag.privacy[setting] } }
                        : tag
                )
            }));
        }
    },

    getPublicTag: async (tagId: string) => {
        try {
            const response = await api.get(`/tags/public/${tagId}`);
            return response.data;
        } catch (error) {
            return null;
        }
    }
}));
