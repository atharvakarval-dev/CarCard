import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
    _id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
    avatar?: string;
    token?: string;
    role?: 'user' | 'admin';
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    sendOtp: (phoneNumber: string) => Promise<boolean>;
    verifyOtp: (phoneNumber: string, otp: string) => Promise<boolean>;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,
            isAuthenticated: false,

            sendOtp: async (phoneNumber) => {
                set({ isLoading: true, error: null });
                try {
                    await api.post('/auth/send-otp', { phoneNumber });
                    set({ isLoading: false });
                    return true;
                } catch (error: any) {
                    set({ isLoading: false, error: error.response?.data?.message || 'Failed to send OTP' });
                    return false;
                }
            },

            verifyOtp: async (phoneNumber, otp) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/verify-otp', { phoneNumber, otp });
                    const { user, token } = response.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    return true;
                } catch (error: any) {
                    set({ isLoading: false, error: error.response?.data?.message || 'Invalid OTP' });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
