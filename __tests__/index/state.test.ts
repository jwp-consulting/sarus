// File Dependencies
import Sarus from "../../src/index";
import { WS } from "jest-websocket-mock";
import { delay } from "../helpers/delay";
import { newWsMock } from "../helpers/websocket";

describe("state machine", () => {
  it("cycles through a closed connection correctly", async () => {
    let { server, url } = newWsMock();

    const sarusConfig = {
      url,
      retryConnectionDelay: 1,
    };

    // In the beginning, the state is "connecting"
    const sarus: Sarus = new Sarus(sarusConfig);
    expect(sarus.state).toBe("connecting");

    // We wait until we are connected, and see a "connected" state
    await server.connected;
    expect(sarus.state).toBe("connected");

    // When the connection drops, the state will be "closed"
    server.close();
    await server.closed;
    expect(sarus.state).toBe("closed");

    // Restart server
    server = new WS(url);

    // We wait a while, and the status is "connecting" again
    await delay(1);
    expect(sarus.state).toBe("connecting");

    // When we connect in our mock server, we are "connected" again
    await server.connected;
    expect(sarus.state).toBe("connected");

    // Cleanup
    server.close();
  });

  it("cycles through disconnect() correctly", async () => {
    let { server, url } = newWsMock();

    const sarusConfig = {
      url,
      retryConnectionDelay: 1,
    };

    // Same initial state transition as above
    const sarus: Sarus = new Sarus(sarusConfig);
    expect(sarus.state).toBe("connecting");
    await server.connected;
    expect(sarus.state).toBe("connected");

    // The user can disconnect and the state will be "disconnected"
    sarus.disconnect();
    expect(sarus.state).toBe("disconnected");
    await server.closed;

    // The user can now reconnect, and the state will be "connecting", and then
    // "connected" again
    sarus.connect();
    expect(sarus.state).toBe("connecting");
    await server.connected;
    // XXX for some reason the test will fail without waiting 10 ms here
    await delay(10);
    expect(sarus.state).toBe("connected");
    server.close();
  });

  it("never enters a connected state without an open WS mock", async () => {
    const server: WS = new WS(url);
    server.close();
    // Using this "opened" variable, we try to catch Sarus entering an open
    // state intermittently. Just using delay(n) to try to "catch" it thinking
    // that it's connected might not work since we can't time the test execution
    // precisely enough and it might already have transition from connected ->
    // closed -> connecting again.
    let opened = false;
    // We create a new Sarus
    const sarus: Sarus = new Sarus({
      ...sarusConfig,
      eventListeners: {
        open: [() => {opened = true;}],
      }
    });
    expect(opened).toBe(false);
    await delay(100);
    // Whoosh, we have connected to /something/, without creating a WS mock
    expect(opened).toBe(true);
  });
});
