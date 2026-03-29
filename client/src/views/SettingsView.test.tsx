import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsView from './SettingsView.js';

const mockSyncResult = {
  status: 'ok',
  data: {
    imported: 2,
    classified: 2,
    alreadyUpToDate: 10,
    errors: 0,
    before: {
      BUILD: 5,
      ORIENTATION: 3,
      KNOWLEDGE: 2,
      RESEARCH: 1,
      OPS: 1,
      TEST: 0,
      unclassified: 0,
    },
    after: {
      BUILD: 6,
      ORIENTATION: 4,
      KNOWLEDGE: 2,
      RESEARCH: 1,
      OPS: 1,
      TEST: 0,
      unclassified: 0,
    },
    totalBefore: 12,
    totalAfter: 14,
    newByProject: [],
  },
};

const mockStatsResult = {
  status: 'ok',
  data: {
    byType: {
      BUILD: 6,
      ORIENTATION: 4,
      KNOWLEDGE: 2,
      RESEARCH: 1,
      OPS: 1,
      TEST: 0,
      unclassified: 0,
    },
    total: 14,
  },
};

const mockSyncStatus = {
  status: 'ok',
  data: { lastSync: null },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/sync/status') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncStatus),
      });
    }
    if (url === '/api/stats') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatsResult),
      });
    }
    // Default for any other URL
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockSyncResult),
    });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SettingsView', () => {
  it('renders the re-enrich button', async () => {
    render(<SettingsView />);
    expect(screen.getByText('Re-enrich All Sessions')).toBeInTheDocument();
  });

  it('renders the Session Enrichment heading', async () => {
    render(<SettingsView />);
    expect(screen.getByText('Session Enrichment')).toBeInTheDocument();
  });

  it('calls fetch with ?force=true when re-enrich button is clicked', async () => {
    render(<SettingsView />);
    const button = screen.getByText('Re-enrich All Sessions');
    fireEvent.click(button);

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls).toContain('/api/sync?force=true');
    });

    // Verify it was a POST
    const enrichCall = fetchMock.mock.calls.find((c: unknown[]) => c[0] === '/api/sync?force=true');
    expect(enrichCall?.[1]).toEqual({ method: 'POST' });
  });

  it('shows "Re-enriching..." while in progress', async () => {
    // Make the enrich fetch hang
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/sync/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSyncStatus),
        });
      }
      if (url === '/api/stats') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatsResult),
        });
      }
      // Hang for the sync/enrich call
      return new Promise(() => {});
    });

    render(<SettingsView />);
    const button = screen.getByText('Re-enrich All Sessions');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Re-enriching…')).toBeInTheDocument();
    });
  });

  it('disables both buttons while either operation is running', async () => {
    // Make the enrich fetch hang
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/sync/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSyncStatus),
        });
      }
      if (url === '/api/stats') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatsResult),
        });
      }
      return new Promise(() => {});
    });

    render(<SettingsView />);
    const enrichButton = screen.getByText('Re-enrich All Sessions');
    fireEvent.click(enrichButton);

    await waitFor(() => {
      // Both buttons should be disabled
      const syncButton = screen.getByText('Sync Sessions');
      expect(syncButton).toBeDisabled();
      expect(screen.getByText('Re-enriching…')).toBeDisabled();
    });
  });

  it('disables re-enrich button while sync is running', async () => {
    // Make sync hang
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/sync/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSyncStatus),
        });
      }
      if (url === '/api/stats') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatsResult),
        });
      }
      return new Promise(() => {});
    });

    render(<SettingsView />);
    const syncButton = screen.getByText('Sync Sessions');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(screen.getByText('Re-enrich All Sessions')).toBeDisabled();
      expect(screen.getByText('Syncing…')).toBeDisabled();
    });
  });
});
