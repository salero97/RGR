import { useState, useEffect, useCallback, useRef } from 'react';

export default function useInfiniteScroll(fetchPage, { limit = 20, deps = [] } = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
  }, []);

  // Новая функция reload — сбрасывает и сразу загружает первую страницу
  const reload = useCallback(async () => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    setLoading(true);
    setError(null);
    loadingRef.current = true;

    try {
      const result = await fetchPage(1, limit);
      const data = result?.data || [];
      const total = result?.meta?.totalPages || 1;

      setItems(data);
      setTotalPages(total);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchPage, limit]);

  useEffect(() => {
    reset();
  }, deps);

  const loadPage = useCallback(async (pageToLoad) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchPage(pageToLoad, limit);
      const data = result?.data || [];
      const total = result?.meta?.totalPages || 1;

      setItems(prev => (pageToLoad === 1 ? data : [...prev, ...data]));
      setTotalPages(total);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchPage, limit]);

  useEffect(() => {
    loadPage(page);
  }, [page, ...deps]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loadingRef.current && page < totalPages) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages]);

  const hasMore = page < totalPages;

  return { items, loading, error, sentinelRef, hasMore, reset, reload };
}