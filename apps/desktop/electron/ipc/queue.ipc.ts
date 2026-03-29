import type { IpcMain } from 'electron';
import type { QueueManager } from '@idm/scheduler';
import { IPC_CHANNELS } from '@idm/shared';

export function setupQueueIpc(ipc: IpcMain, manager: QueueManager): void {
  ipc.handle(IPC_CHANNELS.QUEUE_LIST,   ()                           => manager.getAllQueues());
  ipc.handle(IPC_CHANNELS.QUEUE_CREATE, (_, name: string, opts: any) => manager.createQueue(name, opts));
  ipc.handle(IPC_CHANNELS.QUEUE_UPDATE, (_, id: string, upd: any)    => manager.updateQueue(id, upd));
  ipc.handle(IPC_CHANNELS.QUEUE_DELETE, (_, id: string)              => manager.deleteQueue(id));
  ipc.handle(IPC_CHANNELS.QUEUE_STATS,  ()                           => manager.getState());

  ipc.handle(IPC_CHANNELS.QUEUE_START, (_, id: string) => {
    manager.updateQueue(id, { active: true });
  });

  ipc.handle(IPC_CHANNELS.QUEUE_STOP, (_, id: string) => {
    manager.updateQueue(id, { active: false });
  });
}
