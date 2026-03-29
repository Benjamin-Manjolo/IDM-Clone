import { exec } from 'child_process';
import { promisify } from 'util';
import type { SchedulerAction } from '@idm/shared';

const execAsync = promisify(exec);

export class ShutdownManager {
  async execute(action: SchedulerAction): Promise<void> {
    switch (action) {
      case 'shutdown':   return this.shutdown();
      case 'hibernate':  return this.hibernate();
      case 'sleep':      return this.sleep();
      case 'start':
      case 'stop':
        return; // handled by scheduler
    }
  }

  private async shutdown(): Promise<void> {
    switch (process.platform) {
      case 'win32':  await execAsync('shutdown /s /t 0'); break;
      case 'darwin': await execAsync('sudo shutdown -h now'); break;
      default:       await execAsync('sudo shutdown -h now'); break;
    }
  }

  private async hibernate(): Promise<void> {
    switch (process.platform) {
      case 'win32':  await execAsync('shutdown /h'); break;
      case 'darwin': await execAsync('sudo pmset sleepnow'); break;
      default:       await execAsync('sudo systemctl hibernate'); break;
    }
  }

  private async sleep(): Promise<void> {
    switch (process.platform) {
      case 'win32':  await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0'); break;
      case 'darwin': await execAsync('pmset sleepnow'); break;
      default:       await execAsync('sudo systemctl suspend'); break;
    }
  }
}
