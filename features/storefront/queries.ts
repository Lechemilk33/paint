import { queryOptions } from '@tanstack/react-query';
import { fetchPaintingBySlug, fetchPaintings, fetchSeries } from './catalog';

export const storefrontKeys = {
  all: ['storefront'] as const,
  paintings: () => [...storefrontKeys.all, 'paintings'] as const,
  paintingList: () => [...storefrontKeys.paintings(), 'list'] as const,
  paintingDetails: () => [...storefrontKeys.paintings(), 'detail'] as const,
  paintingDetail: (slug: string) => [...storefrontKeys.paintingDetails(), slug] as const,
  series: () => [...storefrontKeys.all, 'series'] as const,
};

/**
 * The full catalog. Small and immutable within a session, so it is fetched once
 * and every filter runs over the cached array in the browser - switching a
 * filter chip never hits the network.
 */
export function paintingListOptions() {
  return queryOptions({
    queryKey: storefrontKeys.paintingList(),
    queryFn: fetchPaintings,
    staleTime: Infinity,
  });
}

export function paintingDetailOptions(slug: string) {
  return queryOptions({
    queryKey: storefrontKeys.paintingDetail(slug),
    queryFn: () => fetchPaintingBySlug(slug),
    staleTime: Infinity,
  });
}

export function seriesListOptions() {
  return queryOptions({
    queryKey: storefrontKeys.series(),
    queryFn: fetchSeries,
    staleTime: Infinity,
  });
}
