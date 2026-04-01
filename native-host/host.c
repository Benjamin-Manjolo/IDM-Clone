#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void send_message(const char *json) {
  uint32_t len = (uint32_t)strlen(json);
  fwrite(&len, sizeof(len), 1, stdout);
  fwrite(json, 1, len, stdout);
  fflush(stdout);
}

int main(void) {
  while (1) {
    uint32_t len = 0;
    if (fread(&len, sizeof(len), 1, stdin) != 1) {
      break;
    }
    char *buf = (char *)malloc(len + 1);
    if (!buf) {
      break;
    }
    if (fread(buf, 1, len, stdin) != len) {
      free(buf);
      break;
    }
    buf[len] = '\0';

    // MVP host behavior: ACK every message. Extension can use this transport
    // as the native bridge and fallback to WebSocket for rich desktop sync.
    send_message("{\"type\":\"native:ack\",\"data\":{\"ok\":true}}");
    free(buf);
  }
  return 0;
}

