"use client";
import { useCallback, useMemo } from "react";
import { addBookmark, bookmarkId, bookmarkStore, removeBookmark, type BookmarkInput } from "@/lib/storage/bookmarks";
import { useLocalStore } from "./use-local-store";

export function useBookmarks() {
  const items = useLocalStore(bookmarkStore);
  const ids = useMemo(() => new Set(items.map((b) => b.id)), [items]);
  const isSaved = useCallback((url: string) => ids.has(bookmarkId(url)), [ids]);
  const save = useCallback((input: BookmarkInput) => bookmarkStore.set((prev) => addBookmark(prev, input)), []);
  const remove = useCallback((id: string) => bookmarkStore.set((prev) => removeBookmark(prev, id)), []);
  const toggle = useCallback(
    (input: BookmarkInput): boolean => {
      const id = bookmarkId(input.url);
      if (bookmarkStore.get().some((b) => b.id === id)) {
        remove(id);
        return false;
      }
      save(input);
      return true;
    },
    [remove, save],
  );
  const clear = useCallback(() => bookmarkStore.set([]), []);
  return { items, isSaved, save, remove, toggle, clear };
}
