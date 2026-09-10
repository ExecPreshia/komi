/**
 * react-native-draggable-flatlist calls InteractionManager.runAfterInteractions,
 * which is deprecated on newer React Native. Swap it for an idle/microtask
 * scheduler before that library runs so drag/reorder stays intact without the warning.
 */
import { InteractionManager } from 'react-native';

type Task = (() => unknown) | { gen: () => unknown };

InteractionManager.runAfterInteractions = ((task?: Task) => {
  let cancelled = false;

  const run = () => {
    if (cancelled || task == null) return;
    if (typeof task === 'function') {
      task();
      return;
    }
    if (typeof task.gen === 'function') task.gen();
  };

  const idle = (
    globalThis as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
  ).requestIdleCallback;

  if (typeof idle === 'function') {
    idle(() => run(), { timeout: 100 });
  } else {
    queueMicrotask(run);
  }

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}) as typeof InteractionManager.runAfterInteractions;
