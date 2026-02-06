import { useState, useEffect, useCallback } from "react";

// Loading state hook for async tasks
export function useLoadingState() {
  const [pendingTasks, setPendingTasks] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(pendingTasks > 0);
  }, [pendingTasks]);

  const startTask = useCallback(() => {
    setPendingTasks((prev) => prev + 1);
  }, []);

  const endTask = useCallback(() => {
    setPendingTasks((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    loading,
    pendingTasks,
    setPendingTasks,
    startTask,
    endTask,
  };
}
