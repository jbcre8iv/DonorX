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
    website?: string;
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
  logoUrl?: string;
  icon?: string; // For categories
}

export interface DonationDraft {
  id?: string;
  amountCents: number;
  frequency: "one-time" | "monthly" | "quarterly" | "annually";
  allocations: DraftAllocation[];
  lockedIds?: string[]; // Target IDs that are locked from auto-balance
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
    logoUrl?: string;
    icon?: string;
  }, options?: { skipTabSwitch?: boolean }) => Promise<void>;
  removeFromDraft: (targetId: string) => Promise<void>;
  updateDraftAllocation: (targetId: string, percentage: number) => Promise<void>;
  isInDraft: (nonprofitId?: string, categoryId?: string) => boolean;
  toggleLockAllocation: (targetId: string, currentPercentage?: number) => Promise<void>;
  isLocked: (targetId: string) => boolean;
  canLock: (targetId: string) => boolean; // Returns false if locking would lock all items

  // Pending removal (for confirmation dialog)
  pendingRemoval: { targetId: string; targetName: string } | null;
  setPendingRemoval: (item: { targetId: string; targetName: string } | null) => void;
  confirmRemoval: () => Promise<void>;

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

  // Pending removal for confirmation dialog (synced between sidebar and donate page)
  const [pendingRemoval, setPendingRemoval] = useState<{ targetId: string; targetName: string } | null>(null);

  // Track when we're doing a local draft operation to ignore our own realtime updates
  const isLocalDraftOperation = useRef(false);

  // Ref to access latest donationDraft in callbacks (avoids stale closures)
  const donationDraftRef = useRef<DonationDraft | null>(null);

  // Use ref for supabase client to ensure stability across renders
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

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

  // Fetch from database for logged-in users with built-in timeout
  const fetchFromDatabase = useCallback(async (uid: string, timeoutMs = 10000) => {
    console.log("[CartFavorites] fetchFromDatabase starting for user:", uid);
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Fetch cart items and favorites in parallel
      const cartPromise = supabase
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
        .eq("user_id", uid)
        .abortSignal(controller.signal);

      const favoritesPromise = supabase
        .from("user_favorites")
        .select(`
          id,
          nonprofit_id,
          category_id,
          created_at,
          nonprofits:nonprofit_id (id, name, logo_url, mission, website),
          categories:category_id (id, name, icon)
        `)
        .eq("user_id", uid)
        .abortSignal(controller.signal);

      // Run cart and favorites queries in parallel
      const [cartResult, favoritesResult] = await Promise.all([cartPromise, favoritesPromise]);
      clearTimeout(timeoutId);

      const dbCartItems = cartResult.data;
      const dbFavorites = favoritesResult.data;

      console.log("[CartFavorites] Queries completed in", Date.now() - startTime, "ms");
      console.log("[CartFavorites] Cart items:", dbCartItems?.length ?? 0, "Favorites:", dbFavorites?.length ?? 0);

      if (cartResult.error) console.error("[CartFavorites] Cart query error:", cartResult.error);
      if (favoritesResult.error) console.error("[CartFavorites] Favorites query error:", favoritesResult.error);

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
                website: item.nonprofits.website,
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
        .abortSignal(controller.signal)
        .single();

      const transformedDraft: DonationDraft | null = dbDraft
        ? {
            id: dbDraft.id,
            amountCents: dbDraft.amount_cents,
            frequency: dbDraft.frequency,
            allocations: typeof dbDraft.allocations === "string"
              ? JSON.parse(dbDraft.allocations)
              : dbDraft.allocations,
            lockedIds: dbDraft.locked_ids
              ? (typeof dbDraft.locked_ids === "string"
                  ? JSON.parse(dbDraft.locked_ids)
                  : dbDraft.locked_ids)
              : undefined,
            updatedAt: dbDraft.updated_at,
          }
        : null;

      return { cart: transformedCart, favorites: transformedFavorites, draft: transformedDraft };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        console.error("[CartFavorites] Database fetch aborted (timeout)");
      } else {
        console.error("[CartFavorites] Error fetching from database:", error);
      }
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
    let lastVisibilitySyncTime = 0;
    let pollInterval: NodeJS.Timeout | null = null;
    let isSyncing = false;

    const syncData = async (source: string, minInterval = 2000) => {
      // Prevent concurrent syncs
      if (isSyncing) return;

      // Throttle based on source-specific interval
      const now = Date.now();
      if (now - lastSyncTime < minInterval) return;

      if (!userId) return;

      isSyncing = true;
      lastSyncTime = now;

      try {
        // Add timeout to prevent sync from hanging indefinitely
        const fetchPromise = fetchFromDatabase(userId);
        const timeoutPromise = new Promise<{ cart: typeof cartItems; favorites: typeof favorites; draft: typeof donationDraft }>((_, reject) =>
          setTimeout(() => reject(new Error('Sync timeout')), 8000)
        );

        const freshData = await Promise.race([fetchPromise, timeoutPromise]);
        setCartItems(freshData.cart);
        setFavorites(freshData.favorites);
        setDonationDraft(freshData.draft);
        saveToLocalStorage(freshData.cart, freshData.favorites);
      } catch (err) {
        // Silently ignore sync errors - they're not critical
        if (err instanceof Error && err.message !== 'Sync timeout') {
          console.error('[Sync] Error:', err);
        }
      } finally {
        isSyncing = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When becoming visible, sync immediately (no throttle for visibility changes)
        // This is the primary sync mechanism for mobile
        const now = Date.now();
        if (now - lastVisibilitySyncTime > 500) {
          lastVisibilitySyncTime = now;
          syncData('visibilitychange', 0);
        }
      }
    };

    const handleFocus = () => {
      // Focus events are less reliable on mobile, use shorter throttle
      syncData('focus', 1000);
    };

    // Mobile Safari: pageshow fires when navigating back to a cached page
    const handlePageShow = (event: PageTransitionEvent) => {
      // Sync regardless of persisted state - this catches more mobile scenarios
      syncData('pageshow', 0);
    };

    // Touch start can indicate user is interacting with mobile device
    // Reduced from 10s to 5s for better mobile responsiveness
    const handleTouchStart = () => {
      const now = Date.now();
      if (now - lastSyncTime > 5000 && userId) {
        syncData('touchstart', 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    // Add touch listener for mobile - throttled
    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Fallback polling every 15 seconds when tab is visible (more frequent for mobile reliability)
    pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && userId) {
        syncData('poll', 10000);
      }
    }, 15000);

    // Initial sync when effect runs (catches mobile app resume scenarios)
    if (userId && document.visibilityState === 'visible') {
      syncData('mount', 0);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('touchstart', handleTouchStart);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [userId, fetchFromDatabase, saveToLocalStorage]);

  // Keep ref in sync with donationDraft state (for avoiding stale closures)
  useEffect(() => {
    donationDraftRef.current = donationDraft;
  }, [donationDraft]);

  // Initialize - check auth and load data
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Safety timeout to ensure loading never gets stuck
    // With AbortController on queries, this should rarely fire
    const loadingTimeout = setTimeout(() => {
      console.warn("[CartFavorites] Initialization timed out after 15s, forcing loading to false");
      setIsLoading(false);
    }, 15000);

    const initialize = async () => {
      try {
        // Use getSession instead of getUser - it's faster and doesn't make a network request
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;

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
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
        }

        // User is logged in - load from localStorage FIRST for immediate display
        // This prevents showing empty state while fetching from database
        const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        const hasLocalData = (storedFavorites && JSON.parse(storedFavorites).length > 0) ||
                             (storedCart && JSON.parse(storedCart).length > 0);

        if (hasLocalData) {
          loadFromLocalStorage();
          // Set loading to false so user sees data immediately
          // Database fetch will update in the background
          setIsLoading(false);
        }

        // User is logged in at this point
        setUserId(user.id);

        // Parse localStorage data for merging with database
        const localCart: CartItem[] = storedCart ? JSON.parse(storedCart) : [];
        const localFavorites: FavoriteItem[] = storedFavorites
          ? JSON.parse(storedFavorites)
          : [];

        // Fetch from database
        // If we have local data, use a timeout so we don't block the UI
        // If no local data, we MUST wait for database (no timeout) to avoid showing empty state
        let dbData: { cart: CartItem[]; favorites: FavoriteItem[]; draft: DonationDraft | null };

        // Fetch from database - fetchFromDatabase has built-in 10s timeout with AbortController
        // If we have local data, it's already showing (loading=false), so this updates in background
        // If no local data, user sees loading state until this completes or times out
        console.log("[CartFavorites] Fetching from database, hasLocalData:", hasLocalData);
        dbData = await fetchFromDatabase(user.id);

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

        // Set up real-time subscriptions in the background (don't block loading)
        // This allows the page to render immediately while subscriptions connect
        setTimeout(() => {
          try {
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
                    if (reconnectTimeout) clearTimeout(reconnectTimeout);

                    reconnectTimeout = setTimeout(async () => {
                      console.log(`[Realtime] Attempting to reconnect ${table}...`);
                      try {
                        await channel.unsubscribe();
                        await channel.subscribe();
                        await onReconnect();
                      } catch (e) {
                        console.error(`[Realtime] Reconnect failed for ${table}:`, e);
                      }
                    }, 2000);
                  }

                  if (status === 'SUBSCRIBED') {
                    if (reconnectTimeout) {
                      clearTimeout(reconnectTimeout);
                      reconnectTimeout = null;
                    }
                  }
                });

              return channel;
            };

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

            const draftsChannel = createChannelWithReconnect(
              `drafts_sync_${user.id}_${Date.now()}`,
              'donation_drafts',
              async (payload) => {
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
          } catch (e) {
            console.error("[CartFavorites] Error setting up realtime subscriptions:", e);
          }
        }, 0);

        clearTimeout(loadingTimeout);
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing cart/favorites:", error);
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      }
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
      clearTimeout(loadingTimeout);
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
    // Update local state and ref immediately (ref ensures callbacks get latest value)
    setDonationDraft(draft);
    donationDraftRef.current = draft;

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
              locked_ids: draft.lockedIds ? JSON.stringify(draft.lockedIds) : null,
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
    donationDraftRef.current = null;

    if (userId) {
      try {
        // Mark that we're doing a local operation so realtime ignores our own update
        isLocalDraftOperation.current = true;
        const { error } = await supabase
          .from("donation_drafts")
          .delete()
          .eq("user_id", userId);

        if (error) {
          console.error("Error deleting donation draft:", error);
        }
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
      return donationDraft?.allocations.some(
        (a) =>
          (nonprofitId && a.type === "nonprofit" && a.targetId === nonprofitId) ||
          (categoryId && a.type === "category" && a.targetId === categoryId)
      ) ?? false;
    },
    [donationDraft]
  );

  // Add item directly to donation draft allocations (creates draft if none exists)
  // Auto-balances immediately without requiring user confirmation
  const addToDraft = useCallback(
    async (item: {
      type: "nonprofit" | "category";
      targetId: string;
      targetName: string;
      logoUrl?: string;
      icon?: string;
    }, options?: { skipTabSwitch?: boolean }) => {
      // Use ref to get latest draft (avoids stale closure issues)
      const currentDraft = donationDraftRef.current;

      // Open the sidebar immediately on desktop only (don't interrupt mobile browsing)
      // 1024px is the lg breakpoint in Tailwind
      // Skip tab switch if requested (e.g., when adding from favorites tab)
      if (!options?.skipTabSwitch) {
        setActiveTab("cart");
      }
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }

      // If no draft exists or draft has no allocations, create/update with this item at 100%
      if (!currentDraft || currentDraft.allocations.length === 0) {
        const newDraft: DonationDraft = {
          amountCents: currentDraft?.amountCents ?? 10000000, // $100,000 default
          frequency: currentDraft?.frequency ?? "one-time",
          allocations: [{ ...item, percentage: 100 }],
        };
        await saveDonationDraft(newDraft);
        return;
      }

      // Check if already in draft
      const alreadyInDraft = currentDraft.allocations.some(
        (a) => a.type === item.type && a.targetId === item.targetId
      );
      if (alreadyInDraft) return;

      // Get existing items
      const existingItems = currentDraft.allocations;
      const lockedIds = currentDraft.lockedIds || [];

      // Separate locked and unlocked existing items
      const lockedExisting = existingItems.filter((a) => lockedIds.includes(a.targetId));
      const unlockedExisting = existingItems.filter((a) => !lockedIds.includes(a.targetId));

      // Calculate total locked percentage
      const lockedTotal = lockedExisting.reduce((sum, a) => sum + a.percentage, 0);

      // Remaining percentage to distribute among unlocked items and the new item
      const remainingPercentage = Math.max(0, 100 - lockedTotal);
      const totalUnlockedItems = unlockedExisting.length + 1; // +1 for new item

      if (totalUnlockedItems === 1 && unlockedExisting.length === 0) {
        // All existing items are locked, add new item with remaining percentage
        const newAllocations: DraftAllocation[] = [
          ...existingItems,
          { ...item, percentage: remainingPercentage },
        ];
        await saveDonationDraft({
          ...currentDraft,
          allocations: newAllocations,
        });
        return;
      }

      // Auto-balance: distribute remaining percentage equally among unlocked items + new item
      const equalPercentage = Math.floor(remainingPercentage / totalUnlockedItems);
      const remainder = remainingPercentage - (equalPercentage * totalUnlockedItems);

      // Build new allocations: locked items keep their values, unlocked get redistributed
      let firstUnlockedAssigned = false;
      const newAllocations: DraftAllocation[] = [
        ...existingItems.map((alloc) => {
          if (lockedIds.includes(alloc.targetId)) {
            return alloc; // Locked items keep their percentage
          }
          const pct = !firstUnlockedAssigned ? equalPercentage + remainder : equalPercentage;
          firstUnlockedAssigned = true;
          return { ...alloc, percentage: pct };
        }),
        { ...item, percentage: equalPercentage },
      ];

      // Save immediately (no blocking suggestion popup)
      await saveDonationDraft({
        ...currentDraft,
        allocations: newAllocations,
      });
    },
    [saveDonationDraft]
  );

  // Remove item from donation draft allocations
  const removeFromDraft = useCallback(
    async (targetId: string) => {
      // Use ref to get latest draft (avoids stale closure issues)
      const currentDraft = donationDraftRef.current;
      if (!currentDraft) return;

      const lockedIds = currentDraft.lockedIds || [];

      // Filter out the allocation and also remove from lockedIds if it was locked
      const filteredAllocations = currentDraft.allocations.filter(
        (a) => a.targetId !== targetId
      );
      const filteredLockedIds = lockedIds.filter((id) => id !== targetId);

      // If no allocations left, clear the draft entirely
      if (filteredAllocations.length === 0) {
        await clearDonationDraft();
        return;
      }

      // Separate locked and unlocked remaining allocations
      const lockedAllocations = filteredAllocations.filter((a) => filteredLockedIds.includes(a.targetId));
      const unlockedAllocations = filteredAllocations.filter((a) => !filteredLockedIds.includes(a.targetId));

      // Calculate total locked percentage
      const lockedTotal = lockedAllocations.reduce((sum, a) => sum + a.percentage, 0);

      // Remaining percentage to distribute among unlocked items
      const remainingPercentage = Math.max(0, 100 - lockedTotal);
      const unlockedCount = unlockedAllocations.length;

      let redistributedAllocations: DraftAllocation[];

      if (unlockedCount === 0) {
        // All remaining items are locked, can't redistribute
        redistributedAllocations = filteredAllocations;
      } else {
        const evenPercentage = Math.floor(remainingPercentage / unlockedCount);
        const remainder = remainingPercentage - evenPercentage * unlockedCount;

        let firstUnlockedAssigned = false;
        redistributedAllocations = filteredAllocations.map((a) => {
          if (filteredLockedIds.includes(a.targetId)) {
            return a; // Locked items keep their percentage
          }
          const pct = !firstUnlockedAssigned ? evenPercentage + remainder : evenPercentage;
          firstUnlockedAssigned = true;
          return { ...a, percentage: pct };
        });
      }

      const updatedDraft: DonationDraft = {
        ...currentDraft,
        allocations: redistributedAllocations,
        lockedIds: filteredLockedIds.length > 0 ? filteredLockedIds : undefined,
      };

      // Save the updated draft
      await saveDonationDraft(updatedDraft);
    },
    [saveDonationDraft, clearDonationDraft]
  );

  // Update a single allocation's percentage in the draft
  const updateDraftAllocation = useCallback(
    async (targetId: string, percentage: number) => {
      // Use ref to get latest draft (avoids stale closure issues)
      const currentDraft = donationDraftRef.current;
      if (!currentDraft) return;

      const clampedPercentage = Math.max(0, Math.min(percentage, 100));

      const updatedAllocations = currentDraft.allocations.map((a) =>
        a.targetId === targetId ? { ...a, percentage: clampedPercentage } : a
      );

      const updatedDraft: DonationDraft = {
        ...currentDraft,
        allocations: updatedAllocations,
      };

      await saveDonationDraft(updatedDraft);
    },
    [saveDonationDraft]
  );

  // Confirm pending removal (actually removes the item from draft)
  const confirmRemoval = useCallback(async () => {
    if (!pendingRemoval) return;

    await removeFromDraft(pendingRemoval.targetId);
    setPendingRemoval(null);
  }, [pendingRemoval, removeFromDraft]);

  // Check if a specific allocation is locked
  const isLocked = useCallback(
    (targetId: string) => {
      return donationDraft?.lockedIds?.includes(targetId) ?? false;
    },
    [donationDraft]
  );

  // Check if we can lock an allocation (must leave at least one unlocked)
  const canLock = useCallback(
    (targetId: string) => {
      if (!donationDraft) return false;

      // If already locked, can always unlock
      if (donationDraft.lockedIds?.includes(targetId)) return true;

      // Count unlocked items (items not in lockedIds)
      const lockedIds = donationDraft.lockedIds || [];
      const unlockedCount = donationDraft.allocations.filter(
        (a) => !lockedIds.includes(a.targetId)
      ).length;

      // Can only lock if there will be at least 1 unlocked item remaining
      return unlockedCount > 1;
    },
    [donationDraft]
  );

  // Toggle lock on an allocation
  // Note: This only toggles the lock state, it does NOT auto-balance.
  // Auto-balance happens when user clicks the Auto-balance button.
  // currentPercentage: Optional - pass the current input value to avoid race conditions
  const toggleLockAllocation = useCallback(
    async (targetId: string, currentPercentage?: number) => {
      // Use ref to get latest draft (avoids stale closure issues)
      const currentDraft = donationDraftRef.current;
      if (!currentDraft) return;

      const currentLockedIds = currentDraft.lockedIds || [];
      const isCurrentlyLocked = currentLockedIds.includes(targetId);

      let newLockedIds: string[];

      if (isCurrentlyLocked) {
        // Unlock
        newLockedIds = currentLockedIds.filter((id) => id !== targetId);
      } else {
        // Check if we can lock (must leave at least one unlocked)
        // Count unlocked items using ref
        const unlockedCount = currentDraft.allocations.filter(
          (a) => !currentLockedIds.includes(a.targetId)
        ).length;
        if (unlockedCount <= 1) return; // Can't lock if it would lock all items
        newLockedIds = [...currentLockedIds, targetId];
      }

      // If currentPercentage is provided, update the allocation with that value
      // This ensures the typed input value is saved even if the async save hasn't completed
      let newAllocations = currentDraft.allocations;
      if (currentPercentage !== undefined) {
        newAllocations = currentDraft.allocations.map((a) =>
          a.targetId === targetId ? { ...a, percentage: currentPercentage } : a
        );
      }

      await saveDonationDraft({
        ...currentDraft,
        allocations: newAllocations,
        lockedIds: newLockedIds,
      });
    },
    [saveDonationDraft]
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
    removeFromDraft,
    updateDraftAllocation,
    isInDraft,
    toggleLockAllocation,
    isLocked,
    canLock,
    pendingRemoval,
    setPendingRemoval,
    confirmRemoval,
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
