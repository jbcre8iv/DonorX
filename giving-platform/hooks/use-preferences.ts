"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// Storage key for localStorage
const PREFERENCES_STORAGE_KEY = "donorx_preferences";

// Type for user preferences
export interface UserPreferences {
  directory_view_mode?: "grid" | "table";
  favorites_view_mode?: "grid" | "table";
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  directory_view_mode: "grid",
};

interface PreferencesState {
  preferences: UserPreferences;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to manage user preferences with two-tier persistence:
 * 1. localStorage for session persistence (all users)
 * 2. Database for permanent persistence (authenticated users)
 */
export function usePreferences() {
  const [state, setState] = useState<PreferencesState>({
    preferences: DEFAULT_PREFERENCES,
    loading: true,
    isAuthenticated: false,
  });

  // Load preferences from localStorage
  const loadFromLocalStorage = useCallback((): UserPreferences => {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;

    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      console.warn("Failed to load preferences from localStorage");
    }
    return DEFAULT_PREFERENCES;
  }, []);

  // Save preferences to localStorage
  const saveToLocalStorage = useCallback((prefs: UserPreferences) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      console.warn("Failed to save preferences to localStorage");
    }
  }, []);

  // Load preferences from database for authenticated users
  const loadFromDatabase = useCallback(async (userId: string): Promise<UserPreferences | null> => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userId)
        .single();

      if (error) {
        // Profile might not exist yet, that's okay
        if (error.code !== "PGRST116") {
          console.warn("Failed to load preferences from database:", error);
        }
        return null;
      }

      return data?.preferences as UserPreferences | null;
    } catch {
      console.warn("Failed to load preferences from database");
      return null;
    }
  }, []);

  // Save preferences to database for authenticated users
  const saveToDatabase = useCallback(async (userId: string, prefs: UserPreferences) => {
    const supabase = createClient();

    try {
      // Upsert the profile with new preferences
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          preferences: prefs,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "id",
        });

      if (error) {
        console.warn("Failed to save preferences to database:", error);
      }
    } catch {
      console.warn("Failed to save preferences to database");
    }
  }, []);

  // Initialize preferences on mount
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function initPreferences() {
      // First, load from localStorage for immediate display
      const localPrefs = loadFromLocalStorage();

      if (isMounted) {
        setState(prev => ({
          ...prev,
          preferences: localPrefs,
        }));
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (user && isMounted) {
        // User is authenticated, try to load from database
        const dbPrefs = await loadFromDatabase(user.id);

        if (dbPrefs && isMounted) {
          // Database preferences take precedence
          const mergedPrefs = { ...localPrefs, ...dbPrefs };
          setState({
            preferences: mergedPrefs,
            loading: false,
            isAuthenticated: true,
          });
          // Sync to localStorage
          saveToLocalStorage(mergedPrefs);
        } else if (isMounted) {
          // No database preferences, use local and sync to database
          setState({
            preferences: localPrefs,
            loading: false,
            isAuthenticated: true,
          });
          // Sync localStorage preferences to database
          await saveToDatabase(user.id, localPrefs);
        }
      } else if (isMounted) {
        // Not authenticated, just use localStorage
        setState({
          preferences: localPrefs,
          loading: false,
          isAuthenticated: false,
        });
      }
    }

    initPreferences();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // User just signed in, sync preferences
        const localPrefs = loadFromLocalStorage();
        const dbPrefs = await loadFromDatabase(session.user.id);

        if (dbPrefs) {
          // Database preferences take precedence
          const mergedPrefs = { ...localPrefs, ...dbPrefs };
          if (isMounted) {
            setState({
              preferences: mergedPrefs,
              loading: false,
              isAuthenticated: true,
            });
          }
          saveToLocalStorage(mergedPrefs);
        } else {
          // No database preferences, sync local to database
          if (isMounted) {
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
            }));
          }
          await saveToDatabase(session.user.id, localPrefs);
        }
      } else if (event === "SIGNED_OUT") {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
          }));
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadFromLocalStorage, loadFromDatabase, saveToLocalStorage, saveToDatabase]);

  // Update a single preference
  const setPreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const supabase = createClient();

    setState(prev => {
      const newPrefs = { ...prev.preferences, [key]: value };

      // Save to localStorage immediately
      saveToLocalStorage(newPrefs);

      return {
        ...prev,
        preferences: newPrefs,
      };
    });

    // If authenticated, also save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const currentPrefs = loadFromLocalStorage();
      await saveToDatabase(user.id, currentPrefs);
    }
  }, [saveToLocalStorage, saveToDatabase, loadFromLocalStorage]);

  return {
    ...state,
    setPreference,
  };
}
