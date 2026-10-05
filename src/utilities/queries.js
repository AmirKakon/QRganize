import { useCallback } from "react";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  getAllItems,
  getAllContainers,
  getAllAreas,
  getLotsByItem,
  getLotsByContainer,
} from "./api";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Bump when the cached data's shape changes so old caches are discarded.
export const CACHE_BUSTER = "1";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cached lists render instantly (e.g. on Back) and refresh in the
      // background once older than this. Mutations invalidate explicitly.
      staleTime: 30 * 1000,
      // Must be >= the persister's maxAge or restored data is dropped.
      gcTime: ONE_DAY_MS,
      retry: 1,
    },
  },
});

// localStorage can throw (private mode, quota exceeded); a failed write just
// means no offline copy, never a broken app.
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("Could not persist the data cache:", error);
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // nothing to clean up
    }
  },
};

export const persistOptions = {
  persister: createSyncStoragePersister({ storage: safeLocalStorage, key: "qrganize-cache" }),
  maxAge: ONE_DAY_MS,
  buster: CACHE_BUSTER,
};

export const queryKeys = {
  items: ["items"],
  containers: ["containers"],
  areas: ["areas"],
  lotsByItem: (itemId) => ["lots", "item", String(itemId)],
  lotsByContainer: (containerId) => ["lots", "container", String(containerId)],
};

// A stable empty list, so `data` keeps the same identity while loading and
// doesn't retrigger effects/memos that depend on it.
const NONE = [];

const useListQuery = (options) => {
  const query = useQuery(options);
  return { ...query, data: query.data ?? NONE };
};

// Shared so imperative reads (queryClient.ensureQueryData) match useItems.
export const itemsQuery = {
  queryKey: queryKeys.items,
  queryFn: async () => (await getAllItems()) || [],
};

export const useItems = () => useListQuery(itemsQuery);

export const useContainers = () =>
  useListQuery({ queryKey: queryKeys.containers, queryFn: async () => (await getAllContainers()) || [] });

export const useAreas = () =>
  useListQuery({ queryKey: queryKeys.areas, queryFn: getAllAreas });

export const useLotsByItem = (itemId) =>
  useListQuery({
    queryKey: queryKeys.lotsByItem(itemId),
    queryFn: () => getLotsByItem(itemId),
    enabled: Boolean(itemId),
  });

export const useLotsByContainer = (containerId) =>
  useListQuery({
    queryKey: queryKeys.lotsByContainer(containerId),
    queryFn: () => getLotsByContainer(containerId),
    enabled: Boolean(containerId),
  });

// Any stock/item/container change ripples into counts, expiries and container
// contents elsewhere, so refresh everything rather than guess what's affected.
// Only on-screen queries refetch now; the rest refetch when next shown.
export const useRefreshInventory = () => {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries(), [client]);
};
