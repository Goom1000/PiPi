import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Generic hook for BroadcastChannel communication.
 * Handles channel lifecycle and cleanup to prevent memory leaks.
 */
function useBroadcastSync<T>(channelName: string) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [lastMessage, setLastMessage] = useState<T | null>(null);

  useEffect(() => {
    // Create channel on mount
    channelRef.current = new BroadcastChannel(channelName);

    channelRef.current.onmessage = (event: MessageEvent<T>) => {
      setLastMessage(event.data);
    };

    // CRITICAL: Close channel on cleanup to prevent memory leaks
    // MDN explicitly warns about this - channels must be closed
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const postMessage = useCallback((message: T) => {
    channelRef.current?.postMessage(message);
  }, []);

  return { lastMessage, postMessage };
}

export default useBroadcastSync;
