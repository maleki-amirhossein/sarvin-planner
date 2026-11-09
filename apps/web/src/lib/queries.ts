"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, type Operation, type RequestOptions } from "./api";
export const keys = {
  session: ["session"] as const,
  private: ["private"] as const,
};
export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: ({ signal }) => api("getSession", { signal }),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 401) && count < 1,
    staleTime: 30000,
  });
}
export function useApi<K extends Operation>(
  operation: K,
  options: RequestOptions<K> = {},
  enabled = true,
) {
  const session = useSession();
  return useQuery({
    queryKey: ["private", operation, options],
    queryFn: ({ signal }) => api(operation, { ...options, signal }),
    enabled:
      enabled &&
      Boolean(session.data) &&
      !(session.error instanceof ApiError && session.error.status === 401),
    retry: (count, error) =>
      !(
        error instanceof ApiError && [400, 401, 403, 404].includes(error.status)
      ) && count < 1,
  });
}
export function useWrite<K extends Operation>(operation: K) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (options: RequestOptions<K>) => api(operation, options),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.private });
    },
  });
}
