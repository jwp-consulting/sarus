/**
 * Helper for creating jest-websocket-mock instances with unique URLs
 * to avoid connecting to another instance that hasn't been cleaned up properl
 *
 * This is especially useful since jest tests run in parallel, and one test's
 * mock instance might interfere with another, since they might be using the
 * same port.
 */
import { WS } from "jest-websocket-mock";

let wsMockPort = 30000;

/**
 * Create a jest-websocket-mock with a localhost URL with a unique port to avoid
 * instances being shared between test cases
 */
export function newWsMock(): { server: WS; url: string } {
  const url = `ws://localhost:${wsMockPort}`;
  wsMockPort = wsMockPort + 1;
  const server = new WS(url);
  return { server, url };
}
