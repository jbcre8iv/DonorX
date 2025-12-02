"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Types
export interface CartItem {
  id: string;
  nonprofitId?: string;
  categoryId?: string;
  nonprofit?: {
    id: string;
    name: string;
    logoUrl?: string;
    mission?: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
  percentage: number;
  createdAt?: string;
}

export interface FavoriteItem {
  id: string;
  nonprofitId?: string;
  categoryId?: string;
  nonprofit?: {
    id: string;
    name: string;
    logoUrl?: string;
    mission?: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
  createdAt?: string;
}

// Donation draft types
export interface DraftAllocation {
  type: "nonprofit" | "category";
  targetId: string;
  targetName: string;
  percentage: number;
}

export interface DonationDraft {
  id?: string;
  amountCents: number;
  frequency: "one-time" | "monthly" | "quarterly" | "annually";
  allocations: DraftAllocation[];
  updatedAt?: string;
}

// Result type for addToCart operation
export type AddToCartResult =
  | { success: true }
  | { success: false; reason: "blocked_by_draft" | "cart_full" | "already_in_cart" };

interface CartFavoritesContextType {
  // Cart
  cartItems: CartItem[];
  addToCart: (item: {
    nonprofitId?: string;
    categoryId?: string;
    nonprofit?: CartItem["nonprofit"];
    category?: CartItem["category"];
  }) => Promise<AddToCartResult>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartPercentage: (itemId: string, percentage: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (nonprofitId?: string, categoryId?: string) => boolean;
  cartTotal: number;
  openCartSidebar: () => void;

  // Favorites
  favorites: FavoriteItem[];
  addToFavorites: (item: {
    nonprofitId?: string;
    categoryId?: string;
    nonprofit?: FavoriteItem["nonprofit"];
    category?: FavoriteItem["category"];
  }) => Promise<void>;
  removeFromFavorites: (itemId: string) => Promise<void>;
  toggleFavorite: (item: {
    nonprofitId?: string;
    categoryId?: string;
    nonprofit?: FavoriteItem["nonprofit"];
    category?: FavoriteItem["category"];
  }) => Promise<{ success: boolean; requiresAuth?: boolean }>;
  isFavorite: (nonprofitId?: string, categoryId?: string) => boolean;

  // Donation Draft
  donationDraft: DonationDraft | null;
  hasDraft: boolean;
  saveDonationDraft: (draft: DonationDraft) => Promise<void>;
  clearDonationDraft: () => Promise<void>;
  addToDraft: (item: {
    type: "nonprofit" | "category";
    targetId: string;
    targetName: string;
  }) => Promise<void>;
  isInDraft: (nonprofitId?: string, categoryId?: string) => boolean;

  // UI State
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: "cart" | "favorites";
  setActiveTab: (tab: "cart" | "favorites") => void;

  // Loading/sync
  isLoading: boolean;
  userId: string | null;
  refreshFromDatabase: () => Promise<void>;
}

const CartFavoritesContext = createContext<CartFavoritesContextType | null>(
  null
);

const CART_STORAGE_KEY = "donorx_cart";
const FAVORITES_STORAGE_KEY = "donorx_favorites";
const DRAFT_STORAGE_KEY = "donorx_donation_draft";
const MAX_CART_ITEMS = 10;

// Helper to generate temp IDs for localStorage items
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function CartFavoritesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [donationDraft, setDonationDraft] = useState<DonationDraft | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"cart" | "favorites">("cart");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Track when we're doing a local draft operation to ignore our own realtime updates
  const isLocalDraftOperation = useRef(false);

  const supabase = createClient();

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, []);

  // Save to localStorage
  const saveToLocalStorage = useCallback(
    (cart: CartItem[], favs: FavoriteItem[]) => {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    },
    []
  );

  // Fetch from database for logged-in users
  const fetchFromDatabase = useCallback(async (uid: string) => {
    try {
      // Fetch cart items with related data
      const { data: dbCartItems } = await supabase
        .from("cart_items")
        .select(`
          id,
          nonprofit_id,
          category_id,
          percentage,
          created_at,
          nonprofits:nonprofit_id (id, name, logo_url, mission),
          categories:category_id (id, name, icon)
        `)
        .eq("user_id", uid);

      // Fetch favorites with related data
      const { data: dbFavorites } = await supabase
        .from("user_favorites")
        .select(`
          id,
          nonprofit_id,
          category_id,
          created_at,
          nonprofits:nonprofit_id (id, name, logo_url, mission),
          categories:category_id (id, name, icon)
        `)
        .eq("user_id", uid);

      // Transform database format to our format
      const transformedCart: CartItem[] = (dbCartItems || []).map((item: any) => ({
        id: item.id,
        nonprofitId: item.nonprofit_id,
        categoryId: item.category_id,
        percentage: parseFloat(item.percentage) || 0,
        createdAt: item.created_at,
        nonprofit: item.nonprofits
          ? {
              id: item.nonprofits.id,
              name: item.nonprofits.name,
              logoUrl: item.nonprofits.logo_url,
              mission: item.nonprofits.mission,
            }
          : undefined,
        category: item.categories
          ? {
              id: item.categories.id,
              name: item.categories.name,
              icon: item.categories.icon,
            }
          : undefined,
      }));

      const transformedFavorites: FavoriteItem[] = (dbFavorites || []).map(
        (item: any) => ({
          id: item.id,
          nonprofitId: item.nonprofit_id,
          categoryId: item.category_id,
          createdAt: item.created_at,
          nonprofit: item.nonprofits
            ? {
                id: item.nonprofits.id,
                name: item.nonprofits.name,
                logoUrl: item.nonprofits.logo_url,
                mission: item.nonprofits.mission,
              }
            : undefined,
          category: item.categories
            ? {
                id: item.categories.id,
                name: item.categories.name,
                icon: item.categories.icon,
              }
            : undefined,
        })
      );

      // Fetch donation draft
      const { data: dbDraft } = await supabase
        .from("donation_drafts")
        .select("*")
        .eq("user_id", uid)
        .single();

      const transformedDraft: DonationDraft | null = dbDraft
        ? {
            id: dbDraft.id,
            amountCents: dbDraft.amount_cents,
            frequency: dbDraft.frequency,
            allocations: typeof dbDraft.allocations === "string"
              ? JSON.parse(dbDraft.allocations)
              : dbDraft.allocations,
            updatedAt: dbDraft.updated_at,
          }
        : null;

      return { cart: transformedCart, favorites: transformedFavorites, draft: transformedDraft };
    } catch (error) {
      console.error("Error fetching from database:", error);
      return { cart: [], favorites: [], draft: null };
    }
  }, [supabase]);

  // Sync localStorage items to database
  const syncToDatabase = useCallback(
    async (uid: string, localCart: CartItem[], localFavorites: FavoriteItem[]) => {
      try {
        // Get items that are only in localStorage (temp IDs)
        const localOnlyCart = localCart.filter((item) =>
          item.id.startsWith("temp_")
        );
        const localOnlyFavorites = localFavorites.filter((item) =>
          item.id.startsWith("temp_")
        );

        // Insert cart items
        for (const item of localOnlyCart) {
          await supabase.from("cart_items").insert({
            user_id: uid,
            nonprofit_id: item.nonprofitId || null,
            category_id: item.categoryId || null,
            percentage: item.percentage,
          });
        }

        // Insert favorites
        for (const item of localOnlyFavorites) {
          await supabase.from("user_favorites").insert({
            user_id: uid,
            nonprofit_id: item.nonprofitId || null,
            category_id: item.categoryId || null,
          });
        }

        // Re-fetch to get proper IDs
        return await fetchFromDatabase(uid);
      } catch (error) {
        console.error("Error syncing to database:", error);
        return null;
      }
    },
    [supabase, fetchFromDatabase]
  );

  // Re-fetch data when tab becomes visible (handles sync when switching between devices/tabs)
  useEffect(() => {
    let lastSyncTime = 0;

    const syncData = async () => {
      // Throttle to prevent rapid re-syncing (minimum 2 seconds between syncs)
      const now = Date.now();
      if (now - lastSyncTime < 2000) return;
      lastSyncTime = now;

      if (!userId) return;

      try {
        const freshData = await fetchFromDatabase(userId);
        setCartItems(freshData.cart);
        setFavorites(freshData.favorites);
        setDonationDraft(freshData.draft);
        saveToLocalStorage(freshData.cart, freshData.favorites);
      } catch {
        // Silent fail - will retry on next visibility change
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncData();
      }
    };

    const handleFocus = () => {
      syncData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, fetchFromDatabase, saveToLocalStorage]);

  // Initialize - check auth and load data
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const initialize = async () => {
      setIsLoading(true);

      // Check if user is logged in FIRST before loading localStorage
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If no user, just set empty state (don't load from localStorage)
      // The data will persist in the database for when they log back in
      if (!user) {
        setUserId(null);
        setCartItems([]);
        setFavorites([]);
        setDonationDraft(null);
        // Clear localStorage cache since no user is logged in
        // This doesn't affect the database - data is preserved there
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      // Load from localStorage for logged-in users
      loadFromLocalStorage();

      // User is logged in at this point
      setUserId(user.id);

      // Get current localStorage data
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const localCart: CartItem[] = storedCart ? JSON.parse(storedCart) : [];
      const localFavorites: FavoriteItem[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];

      // Fetch from database
      const dbData = await fetchFromDatabase(user.id);

      // Merge: database items take precedence, add any local-only items
      const mergedCart = [...dbData.cart];
      const mergedFavorites = [...dbData.favorites];

      // Add local items that don't exist in database
      for (const localItem of localCart) {
        const exists = mergedCart.some(
          (dbItem) =>
            (localItem.nonprofitId &&
              dbItem.nonprofitId === localItem.nonprofitId) ||
            (localItem.categoryId &&
              dbItem.categoryId === localItem.categoryId)
        );
        if (!exists && mergedCart.length < MAX_CART_ITEMS) {
          mergedCart.push(localItem);
        }
      }

      for (const localItem of localFavorites) {
        const exists = mergedFavorites.some(
          (dbItem) =>
            (localItem.nonprofitId &&
              dbItem.nonprofitId === localItem.nonprofitId) ||
            (localItem.categoryId &&
              dbItem.categoryId === localItem.categoryId)
        );
        if (!exists) {
          mergedFavorites.push(localItem);
        }
      }

      // Sync any local-only items to database
      const hasLocalOnlyItems =
        mergedCart.some((item) => item.id.startsWith("temp_")) ||
        mergedFavorites.some((item) => item.id.startsWith("temp_"));

      if (hasLocalOnlyItems) {
        const syncedData = await syncToDatabase(
          user.id,
          mergedCart,
          mergedFavorites
        );
        if (syncedData) {
          setCartItems(syncedData.cart);
          setFavorites(syncedData.favorites);
          setDonationDraft(syncedData.draft);
          saveToLocalStorage(syncedData.cart, syncedData.favorites);
        }
      } else {
        setCartItems(mergedCart);
        setFavorites(mergedFavorites);
        setDonationDraft(dbData.draft);
        saveToLocalStorage(mergedCart, mergedFavorites);
      }

      // Helper to create subscription with auto-reconnect
      const createChannelWithReconnect = (
        channelName: string,
        table: string,
        onPayload: (payload: any) => Promise<void>,
        onReconnect: () => Promise<void>
      ) => {
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table,
              filter: `user_id=eq.${user.id}`,
            },
            onPayload
          )
          .subscribe((status, err) => {
            console.log(`[Realtime] ${table} subscription status:`, status);

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.log(`[Realtime] ${table} channel error/timeout, scheduling reconnect...`);
              // Clear any existing reconnect timeout
              if (reconnectTimeout) clearTimeout(reconnectTimeout);

              // Try to reconnect after a short delay
              reconnectTimeout = setTimeout(async () => {
                console.log(`[Realtime] Attempting to reconnect ${table}...`);
                try {
                  await channel.unsubscribe();
                  await channel.subscribe();
                  // Fetch fresh data after reconnect
                  await onReconnect();
                } catch (e) {
                  console.error(`[Realtime] Reconnect failed for ${table}:`, e);
                }
              }, 2000);
            }

            if (status === 'SUBSCRIBED') {
              // Clear reconnect timeout on successful subscription
              if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
              }
            }
          });

        return channel;
      };

      // Set up real-time subscriptions for cross-device sync with auto-reconnect
      const cartChannel = createChannelWithReconnect(
        `cart_sync_${user.id}_${Date.now()}`,
        'cart_items',
        async (payload) => {
          console.log('[Realtime] Cart change detected:', payload.eventType);
          const freshData = await fetchFromDatabase(user.id);
          setCartItems(freshData.cart);
          saveToLocalStorage(freshData.cart, freshData.favorites);
        },
        async () => {
          const freshData = await fetchFromDatabase(user.id);
          setCartItems(freshData.cart);
          saveToLocalStorage(freshData.cart, freshData.favorites);
        }
      );
      channels.push(cartChannel);

      const favoritesChannel = createChannelWithReconnect(
        `favorites_sync_${user.id}_${Date.now()}`,
        'user_favorites',
        async (payload) => {
          console.log('[Realtime] Favorites change detected:', payload.eventType);
          const freshData = await fetchFromDatabase(user.id);
          setFavorites(freshData.favorites);
          saveToLocalStorage(freshData.cart, freshData.favorites);
        },
        async () => {
          const freshData = await fetchFromDatabase(user.id);
          setFavorites(freshData.favorites);
          saveToLocalStorage(freshData.cart, freshData.favorites);
        }
      );
      channels.push(favoritesChannel);

      // Real-time subscription for donation drafts (cross-device sync)
      const draftsChannel = createChannelWithReconnect(
        `drafts_sync_${user.id}_${Date.now()}`,
        'donation_drafts',
        async (payload) => {
          // Ignore realtime updates triggered by our own local operations
          if (isLocalDraftOperation.current) {
            console.log('[Realtime] Ignoring own draft change');
            return;
          }
          console.log('[Realtime] Draft change detected from another device:', payload.eventType);
          if (payload.eventType === 'DELETE') {
            setDonationDraft(null);
          } else {
            const freshData = await fetchFromDatabase(user.id);
            setDonationDraft(freshData.draft);
          }
        },
        async () => {
          const freshData = await fetchFromDatabase(user.id);
          setDonationDraft(freshData.draft);
        }
      );
      channels.push(draftsChannel);

      setIsLoading(false);
    };

    initialize();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Fetch user data from database immediately on sign in
        const uid = session.user.id;
        setUserId(uid);

        try {
          const freshData = await fetchFromDatabase(uid);
          setCartItems(freshData.cart);
          setFavorites(freshData.favorites);
          setDonationDraft(freshData.draft);
          saveToLocalStorage(freshData.cart, freshData.favorites);
        } catch (error) {
          console.error("Error fetching data on sign in:", error);
        }
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        // Clean up subscriptions
        channels.forEach(channel => supabase.removeChannel(channel));
        // Clear all user data on logout
        setCartItems([]);
        setFavorites([]);
        setDonationDraft(null);
        // Clear localStorage as well
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track previous userId to detect logout
  const prevUserIdRef = useRef<string | null>(null);

  // Re-check auth status when pathname changes (catches login/logout redirects)
  useEffect(() => {
    const checkAuthAndSync = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Case 1: User just logged out (had userId, now no user)
      if (prevUserIdRef.current && !user) {
        setUserId(null);
        setCartItems([]);
        setFavorites([]);
        setDonationDraft(null);
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }

      // Case 2: User just logged in (no userId in state, but user exists)
      // This catches the case where login redirect happens before SIGNED_IN event
      if (!userId && user) {
        setUserId(user.id);
        try {
          const freshData = await fetchFromDatabase(user.id);
          setCartItems(freshData.cart);
          setFavorites(freshData.favorites);
          setDonationDraft(freshData.draft);
          saveToLocalStorage(freshData.cart, freshData.favorites);
        } catch (error) {
          console.error("Error fetching data on pathname change:", error);
        }
      }

      // Update the ref for next comparison
      prevUserIdRef.current = userId;
    };

    checkAuthAndSync();
  }, [pathname, userId, supabase, fetchFromDatabase, saveToLocalStorage]);

  // Cart total percentage
  const cartTotal = cartItems.reduce((sum, item) => sum + item.percentage, 0);

  // Check if item is in cart
  const isInCart = useCallback(
    (nonprofitId?: string, categoryId?: string) => {
      return cartItems.some(
        (item) =>
          (nonprofitId && item.nonprofitId === nonprofitId) ||
          (categoryId && item.categoryId === categoryId)
      );
    },
    [cartItems]
  );

  // Check if item is favorited
  const isFavorite = useCallback(
    (nonprofitId?: string, categoryId?: string) => {
      return favorites.some(
        (item) =>
          (nonprofitId && item.nonprofitId === nonprofitId) ||
          (categoryId && item.categoryId === categoryId)
      );
    },
    [favorites]
  );

  // Helper to open cart sidebar
  const openCartSidebar = useCallback(() => {
    setActiveTab("cart");
    setSidebarOpen(true);
  }, []);

  // Add to cart
  const addToCart = useCallback(
    async (item: {
      nonprofitId?: string;
      categoryId?: string;
      nonprofit?: CartItem["nonprofit"];
      category?: CartItem["category"];
    }): Promise<AddToCartResult> => {
      // Block adding items when there's an active donation draft
      if (donationDraft) {
        return { success: false, reason: "blocked_by_draft" };
      }

      if (cartItems.length >= MAX_CART_ITEMS) {
        return { success: false, reason: "cart_full" };
      }

      if (isInCart(item.nonprofitId, item.categoryId)) {
        return { success: false, reason: "already_in_cart" };
      }

      const newItem: CartItem = {
        id: generateTempId(),
        nonprofitId: item.nonprofitId,
        categoryId: item.categoryId,
        nonprofit: item.nonprofit,
        category: item.category,
        percentage: 0,
        createdAt: new Date().toISOString(),
      };

      // Update local state immediately (optimistic update)
      const updatedCart = [...cartItems, newItem];
      setCartItems(updatedCart);
      saveToLocalStorage(updatedCart, favorites);

      // If logged in, save to database in background
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("cart_items")
            .insert({
              user_id: userId,
              nonprofit_id: item.nonprofitId || null,
              category_id: item.categoryId || null,
              percentage: 0,
            })
            .select()
            .single();

          if (error) {
            console.error("Error adding to cart:", error);
          } else if (data) {
            // Update the item with the real database ID
            setCartItems(prev => prev.map(cartItem =>
              cartItem.id === newItem.id ? { ...cartItem, id: data.id } : cartItem
            ));
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          // Item still exists in local state, will sync later
        }
      }

      return { success: true };
    },
    [cartItems, favorites, userId, supabase, isInCart, saveToLocalStorage, donationDraft]
  );

  // Remove from cart
  const removeFromCart = useCallback(
    async (itemId: string) => {
      // Update local state first for immediate UI feedback
      const updatedCart = cartItems.filter((item) => item.id !== itemId);
      setCartItems(updatedCart);
      saveToLocalStorage(updatedCart, favorites);

      // If logged in and not a temp ID, delete from database
      if (userId && !itemId.startsWith("temp_")) {
        try {
          await supabase.from("cart_items").delete().eq("id", itemId);
        } catch (error) {
          console.error("Error removing from cart:", error);
        }
      }
    },
    [cartItems, favorites, userId, supabase, saveToLocalStorage]
  );

  // Update cart item percentage
  const updateCartPercentage = useCallback(
    async (itemId: string, percentage: number) => {
      // Update local state first for immediate UI feedback
      const updatedCart = cartItems.map((item) =>
        item.id === itemId ? { ...item, percentage } : item
      );
      setCartItems(updatedCart);
      saveToLocalStorage(updatedCart, favorites);

      // If logged in and not a temp ID, update in database
      if (userId && !itemId.startsWith("temp_")) {
        try {
          await supabase
            .from("cart_items")
            .update({ percentage })
            .eq("id", itemId);
        } catch (error) {
          console.error("Error updating cart percentage:", error);
        }
      }
    },
    [cartItems, favorites, userId, supabase, saveToLocalStorage]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    // Clear local state first for immediate UI feedback
    setCartItems([]);
    saveToLocalStorage([], favorites);

    // If logged in, delete all from database
    if (userId) {
      try {
        const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
        if (error) {
          console.error("Error clearing cart from database:", error);
        }
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  }, [userId, supabase, favorites, saveToLocalStorage]);

  // Add to favorites
  const addToFavorites = useCallback(
    async (item: {
      nonprofitId?: string;
      categoryId?: string;
      nonprofit?: FavoriteItem["nonprofit"];
      category?: FavoriteItem["category"];
    }) => {
      if (isFavorite(item.nonprofitId, item.categoryId)) {
        return; // Already favorited
      }

      const newItem: FavoriteItem = {
        id: generateTempId(),
        nonprofitId: item.nonprofitId,
        categoryId: item.categoryId,
        nonprofit: item.nonprofit,
        category: item.category,
        createdAt: new Date().toISOString(),
      };

      // Update local state immediately (optimistic update)
      const updatedFavorites = [...favorites, newItem];
      setFavorites(updatedFavorites);
      saveToLocalStorage(cartItems, updatedFavorites);

      // If logged in, save to database in background
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("user_favorites")
            .insert({
              user_id: userId,
              nonprofit_id: item.nonprofitId || null,
              category_id: item.categoryId || null,
            })
            .select()
            .single();

          if (error) {
            console.error("Error adding to favorites:", error);
          } else if (data) {
            // Update the item with the real database ID
            setFavorites(prev => prev.map(favItem =>
              favItem.id === newItem.id ? { ...favItem, id: data.id } : favItem
            ));
          }
        } catch (error) {
          console.error("Error adding to favorites:", error);
          // Item still exists in local state, will sync later
        }
      }
    },
    [favorites, cartItems, userId, supabase, isFavorite, saveToLocalStorage]
  );

  // Remove from favorites
  const removeFromFavorites = useCallback(
    async (itemId: string) => {
      // Update local state first for immediate UI feedback
      const updatedFavorites = favorites.filter((item) => item.id !== itemId);
      setFavorites(updatedFavorites);
      saveToLocalStorage(cartItems, updatedFavorites);

      // If logged in and not a temp ID, delete from database
      if (userId && !itemId.startsWith("temp_")) {
        try {
          await supabase.from("user_favorites").delete().eq("id", itemId);
        } catch (error) {
          console.error("Error removing from favorites:", error);
        }
      }
    },
    [favorites, cartItems, userId, supabase, saveToLocalStorage]
  );

  // Toggle favorite (add if not favorited, remove if already favorited)
  const toggleFavorite = useCallback(
    async (item: {
      nonprofitId?: string;
      categoryId?: string;
      nonprofit?: FavoriteItem["nonprofit"];
      category?: FavoriteItem["category"];
    }): Promise<{ success: boolean; requiresAuth?: boolean }> => {
      // Require login to use favorites
      if (!userId) {
        return { success: false, requiresAuth: true };
      }

      const existingFavorite = favorites.find(
        (fav) =>
          (item.nonprofitId && fav.nonprofitId === item.nonprofitId) ||
          (item.categoryId && fav.categoryId === item.categoryId)
      );

      if (existingFavorite) {
        await removeFromFavorites(existingFavorite.id);
      } else {
        await addToFavorites(item);
      }

      return { success: true };
    },
    [favorites, addToFavorites, removeFromFavorites, userId]
  );

  // Manual refresh from database
  const refreshFromDatabase = useCallback(async () => {
    if (!userId) return;

    try {
      const freshData = await fetchFromDatabase(userId);
      setCartItems(freshData.cart);
      setFavorites(freshData.favorites);
      setDonationDraft(freshData.draft);
      saveToLocalStorage(freshData.cart, freshData.favorites);
    } catch (error) {
      console.error("Error refreshing from database:", error);
    }
  }, [userId, fetchFromDatabase, saveToLocalStorage]);

  // Save donation draft
  const saveDonationDraft = useCallback(async (draft: DonationDraft) => {
    // Update local state immediately
    setDonationDraft(draft);

    // If logged in, save to database
    if (userId) {
      try {
        // Mark that we're doing a local operation so realtime ignores our own update
        isLocalDraftOperation.current = true;
        await supabase
          .from("donation_drafts")
          .upsert(
            {
              user_id: userId,
              amount_cents: draft.amountCents,
              frequency: draft.frequency,
              allocations: JSON.stringify(draft.allocations),
            },
            { onConflict: "user_id" }
          );
        // Reset flag after a short delay to ensure realtime event has been processed
        setTimeout(() => {
          isLocalDraftOperation.current = false;
        }, 500);
      } catch (error) {
        console.error("Error saving draft:", error);
        isLocalDraftOperation.current = false;
      }
    }
  }, [userId, supabase]);

  // Clear donation draft
  const clearDonationDraft = useCallback(async () => {
    setDonationDraft(null);

    if (userId) {
      try {
        // Mark that we're doing a local operation so realtime ignores our own update
        isLocalDraftOperation.current = true;
        await supabase
          .from("donation_drafts")
          .delete()
          .eq("user_id", userId);
        // Reset flag after a short delay to ensure realtime event has been processed
        setTimeout(() => {
          isLocalDraftOperation.current = false;
        }, 500);
      } catch (error) {
        console.error("Error clearing draft:", error);
        isLocalDraftOperation.current = false;
      }
    }
  }, [userId, supabase]);

  // Check if item is in draft allocations
  const isInDraft = useCallback(
    (nonprofitId?: string, categoryId?: string) => {
      if (!donationDraft) return false;
      return donationDraft.allocations.some(
        (a) =>
          (nonprofitId && a.type === "nonprofit" && a.targetId === nonprofitId) ||
          (categoryId && a.type === "category" && a.targetId === categoryId)
      );
    },
    [donationDraft]
  );

  // Add item directly to donation draft allocations
  const addToDraft = useCallback(
    async (item: {
      type: "nonprofit" | "category";
      targetId: string;
      targetName: string;
    }) => {
      if (!donationDraft) return;

      // Check if already in draft
      const alreadyInDraft = donationDraft.allocations.some(
        (a) => a.type === item.type && a.targetId === item.targetId
      );
      if (alreadyInDraft) return;

      // Add new allocation and redistribute percentages evenly
      const newAllocations = [...donationDraft.allocations, { ...item, percentage: 0 }];
      const count = newAllocations.length;
      const evenPercentage = Math.floor(100 / count);
      const remainder = 100 - evenPercentage * count;

      const redistributedAllocations = newAllocations.map((a, index) => ({
        ...a,
        percentage: index === 0 ? evenPercentage + remainder : evenPercentage,
      }));

      const updatedDraft: DonationDraft = {
        ...donationDraft,
        allocations: redistributedAllocations,
      };

      // Save the updated draft
      await saveDonationDraft(updatedDraft);
    },
    [donationDraft, saveDonationDraft]
  );

  // Helper to check if there's an active draft (even without allocations)
  const hasDraft = donationDraft !== null;

  const value: CartFavoritesContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartPercentage,
    clearCart,
    isInCart,
    cartTotal,
    openCartSidebar,
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    donationDraft,
    hasDraft,
    saveDonationDraft,
    clearDonationDraft,
    addToDraft,
    isInDraft,
    isSidebarOpen,
    setSidebarOpen,
    activeTab,
    setActiveTab,
    isLoading,
    userId,
    refreshFromDatabase,
  };

  return (
    <CartFavoritesContext.Provider value={value}>
      {children}
    </CartFavoritesContext.Provider>
  );
}

export function useCartFavorites() {
  const context = useContext(CartFavoritesContext);
  if (!context) {
    throw new Error(
      "useCartFavorites must be used within a CartFavoritesProvider"
    );
  }
  return context;
}
