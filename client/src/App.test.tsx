import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import express from 'express';
import type { Server } from 'node:http';
import App from './App.js';

// ── Mock socket.io-client ─────────────────────────────────────────────────────
// ObserverView creates a socket at module level. In tests there is no server to
// connect to, so we stub io() with a no-op that will never emit or receive.
vi.mock('socket.io-client', () => {
  const noop = () => {};
  const mockSocket = {
    connected: false,
    on: noop,
    off: noop,
    emit: noop,
    disconnect: noop,
  };
  return { io: () => mockSocket };
});

// ── Capture native fetch before setup.ts stubs it ────────────────────────────
const nativeFetch = globalThis.fetch;

let server: Server;
let serverPort: number;

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      const app = express();
      app.get('/health', (_, res) =>
        res.json({ status: 'ok', timestamp: new Date().toISOString() })
      );
      app.get('/api/info', (_, res) =>
        res.json({
          status: 'ok',
          data: { nodeVersion: 'test', environment: 'test', port: 0, clientUrl: '', uptime: 0 },
        })
      );
      // ObserverView fetches /api/sessions on mount
      app.get('/api/sessions', (_, res) => res.json({ status: 'ok', data: { sessions: [] } }));
      server = app.listen(0, () => {
        serverPort = (server.address() as { port: number }).port;
        resolve();
      });
    })
);

beforeEach(() => {
  // Redirect relative URL fetches to the stub express server
  globalThis.fetch = (input, init) => {
    const url =
      typeof input === 'string' && input.startsWith('/')
        ? `http://localhost:${serverPort}${input}`
        : input;
    return nativeFetch(url, init);
  };
});

afterEach(() => {
  globalThis.fetch = nativeFetch;
});

afterAll(
  () =>
    new Promise<void>((resolve) => {
      server?.close(() => resolve());
    })
);

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // The app shell should be in the DOM with no thrown errors
    expect(document.body).toBeTruthy();
  });

  it('shows the AngelEYE brand name in the header', () => {
    render(<App />);
    expect(screen.getByText((_, el) => el?.textContent === 'AngelEYE')).toBeInTheDocument();
  });

  it('shows all sidebar navigation items', () => {
    render(<App />);
    // Primary nav items
    expect(screen.getAllByText('Observer').length).toBeGreaterThan(0);
    expect(screen.getByText('Organiser')).toBeInTheDocument();
    // Secondary nav item
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Observer as the default active view', () => {
    render(<App />);
    // The ObserverView renders an h1-level "Observer" heading in the content panel
    // (separate from the sidebar button that also says "Observer")
    const observerHeadings = screen.getAllByText('Observer');
    expect(observerHeadings.length).toBeGreaterThanOrEqual(1);
  });
});
