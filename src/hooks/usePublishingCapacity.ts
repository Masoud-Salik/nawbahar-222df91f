/**
 * Publishing capacity hook — stub that always allows publishing.
 * Can be extended later with real capacity limits.
 */
export function usePublishingCapacity() {
  return {
    stats: null,
    canPublish: true,
    loading: false,
    refetch: () => {},
  };
}