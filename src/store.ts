import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Product } from './types';

export interface CartItem {
  product: Product;
  quantity: number;
  warranty?: boolean;
  warrantyLabel?: string;
  warrantyPrice?: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  currency: string;
  language: string;
  isDbConfigured: boolean;
  isDbConnected: boolean;
  guestTokens: Record<string, string>;
  setUser: (user: User | null, token: string | null) => void;
  setGuestToken: (orderId: string, token: string) => void;
  addToCart: (product: Product, warrantyDetails?: { warranty?: boolean; warrantyLabel?: string; warrantyPrice?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCurrency: (currency: string) => void;
  setLanguage: (language: string) => void;
  setIsDbConfigured: (configured: boolean) => void;
  setIsDbConnected: (connected: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      cart: [],
      currency: 'USD',
      language: 'EN',
      isDbConfigured: true, // Default to true until fetched
      isDbConnected: true, // Default to true until fetched
      guestTokens: {},
      setUser: (user, token) => set({ user, token }),
      setGuestToken: (orderId, token) =>
        set((state) => ({ guestTokens: { ...state.guestTokens, [orderId]: token } })),
      addToCart: (product, warrantyDetails) => set((state) => {
        const existing = state.cart.find((item) => item.product.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.product.id === product.id ? { 
                ...item, 
                quantity: item.quantity + 1,
                ...(warrantyDetails || {})
              } : item
            )
          };
        }
        return { 
          cart: [...state.cart, { 
            product, 
            quantity: 1,
            warranty: warrantyDetails?.warranty,
            warrantyLabel: warrantyDetails?.warrantyLabel,
            warrantyPrice: warrantyDetails?.warrantyPrice,
          }] 
        };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.product.id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map((item) => item.product.id === productId ? { ...item, quantity } : item)
      })),
      clearCart: () => set({ cart: [] }),
      setCurrency: (currency) => set({ currency: (currency || 'USD').toUpperCase() }),
      setLanguage: (language) => {
        const lang = (language || 'EN').toUpperCase();
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang.toLowerCase();
          document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr';
        }
        set({ language: lang });
      },
      setIsDbConfigured: (configured) => set({ isDbConfigured: configured }),
      setIsDbConnected: (connected) => set({ isDbConnected: connected }),
    }),
    {
      name: 'd32-store',
    }
  )
);
