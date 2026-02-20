import { create } from 'zustand';
import api from '../services/api';
import { ENDPOINTS } from '../services/config';

export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: 'car' | 'bike' | 'business' | 'bundle';
    features: string[];
    stock: number;
    isActive: boolean;
}

interface ShopState {
    products: Product[];
    cart: { product: Product; quantity: number }[];
    isLoading: boolean;
    error: string | null;

    fetchProducts: () => Promise<void>;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    checkout: () => Promise<boolean>;
}

export const useShopStore = create<ShopState>((set, get) => ({
    products: [],
    cart: [],
    isLoading: false,
    error: null,

    fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(ENDPOINTS.SHOP_PRODUCTS);
            set({ products: response.data, isLoading: false });
        } catch (error: any) {
            const status = error.response?.status;
            const isNetworkError = !error.response; // no response = server unreachable
            set({
                isLoading: false,
                error: isNetworkError
                    ? 'Cannot reach server. Check your connection.'
                    : `Failed to load products (${status})`,
            });
        }
    },

    addToCart: (product) => {
        set(state => {
            const existing = state.cart.find(item => item.product._id === product._id);
            if (existing) {
                return {
                    cart: state.cart.map(item =>
                        item.product._id === product._id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                };
            }
            return { cart: [...state.cart, { product, quantity: 1 }] };
        });
    },

    removeFromCart: (productId) => {
        set(state => ({
            cart: state.cart.filter(item => item.product._id !== productId),
        }));
    },

    clearCart: () => set({ cart: [] }),

    checkout: async () => {
        set({ isLoading: true });
        try {
            const state = get();
            const items = state.cart.map(item => ({
                productId: item.product._id,
                quantity: item.quantity,
            }));
            const totalAmount = state.cart.reduce(
                (sum, item) => sum + item.product.price * item.quantity, 0
            );

            await api.post(ENDPOINTS.SHOP_ORDERS, { items, totalAmount });
            set({ cart: [], isLoading: false });
            return true;
        } catch (error) {
            set({ isLoading: false, error: 'Checkout failed' });
            return false;
        }
    },
}));
