import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type WindowsPowerAction = 'shutdown' | 'restart' | 'hibernate' | 'sleep' | 'logoff';

/**
 * Execute a Windows power action.
 * All actions have a 10-second delay by default so the user can cancel.
 */
export async function windowsPowerAction(
  action: WindowsPowerAction,
  delaySeconds = 10
): Promise<void> {
  if (process.platform !== 'win32') {
    throw new Error('windowsPowerAction is Windows-only');
  }

  const commands: Record<WindowsPowerAction, string> = {
    shutdown:  `shutdown /s /t ${delaySeconds}`,
    restart:   `shutdown /r /t ${delaySeconds}`,
    hibernate: `shutdown /h`,
    sleep:     `rundll32.exe powrprof.dll,SetSuspendState 0,1,0`,
    logoff:    `shutdown /l`,
  };

  const cmd = commands[action];
  await execAsync(cmd);
}

/** Cancel a pending shutdown or restart. */
export async function cancelPowerAction(): Promise<void> {
  if (process.platform !== 'win32') return;
  await execAsync('shutdown /a').catch(() => {});
}
