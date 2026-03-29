// HTTPS uses the same logic as HTTP — Node's https module is used automatically
// based on URL protocol detection in HttpProtocol. This re-exports for explicit use.
export { HttpProtocol as HttpsProtocol } from './http';
