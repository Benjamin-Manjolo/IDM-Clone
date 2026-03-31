# Native Messaging Host (C)

This folder adds a minimal **C native messaging host** for the extension:

- Host name: `com.idm.clone.host`
- Protocol: Chrome/Edge Native Messaging (`stdio` + 4-byte little-endian length framing)
- Source: `host.c`

## Build (Windows, MinGW example)

```bash
gcc host.c -O2 -o idm-native-host.exe
```

## Register host manifest (Windows)

1. Copy `idm-native-host.exe` and `com.idm.clone.host.json` to a stable install path.
2. Update manifest `path` to the real executable path.
3. Replace `__REPLACE_WITH_EXTENSION_ID__` with your extension ID.
4. Create registry key:

`HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.idm.clone.host`

5. Set default value to the full path of `com.idm.clone.host.json`.

The extension bridge attempts native messaging first and falls back to localhost WebSocket.

