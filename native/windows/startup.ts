import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);
const APP_NAME = 'IDMClone';
const RUN_KEY  = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

export async function enableStartup(exePath: string): Promise<void> {
  if (process.platform !== 'win32') return;
  const quoted = `"${exePath}" --hidden`;
  await execAsync(`reg add "${RUN_KEY}" /v "${APP_NAME}" /t REG_SZ /d ${quoted} /f`);
}

export async function disableStartup(): Promise<void> {
  if (process.platform !== 'win32') return;
  await execAsync(`reg delete "${RUN_KEY}" /v "${APP_NAME}" /f`).catch(() => {});
}

export async function isStartupEnabled(): Promise<boolean> {
  if (process.platform !== 'win32') return false;
  try {
    const { stdout } = await execAsync(`reg query "${RUN_KEY}" /v "${APP_NAME}"`);
    return stdout.includes(APP_NAME);
  } catch {
    return false;
  }
}

/** Returns the path of the running executable. */
export function getExePath(): string {
  return process.execPath;
}
