import type { IpcMain } from 'electron';
import type { Scheduler } from '@idm/scheduler';
import type { DownloadManager } from '@idm/downloader';
import { IPC_CHANNELS } from '@idm/shared';

export function setupSchedulerIpc(
  ipc: IpcMain,
  scheduler: Scheduler,
  downloader: DownloadManager
): void {
  // Start the scheduler engine once IPC is set up
  scheduler.start(async (task) => {
    // When a task fires, start the associated downloads
    for (const id of task.downloadIds ?? []) {
      downloader.resume(id);
    }
  });

  ipc.handle(IPC_CHANNELS.SCHEDULER_LIST,   ()                         => scheduler.getState());
  ipc.handle(IPC_CHANNELS.SCHEDULER_CREATE, (_, task: any)             => scheduler.addTask(task));
  ipc.handle(IPC_CHANNELS.SCHEDULER_UPDATE, (_, id: string, upd: any)  => scheduler.updateTask(id, upd));
  ipc.handle(IPC_CHANNELS.SCHEDULER_DELETE, (_, id: string)            => scheduler.deleteTask(id));
  ipc.handle(IPC_CHANNELS.SCHEDULER_TOGGLE, (_, id: string) => {
    const state = scheduler.getState();
    const task = state.tasks.find(t => t.id === id);
    if (task) scheduler.updateTask(id, { enabled: !task.enabled });
  });
}
