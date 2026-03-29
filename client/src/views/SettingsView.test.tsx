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
    fields: {
      delegation_style: {
        before: { conversational: 5, directive: 7 },
        after: { conversational: 6, directive: 8 },
      },
    },
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
    fields: {
      delegation_style: { conversational: 6, directive: 8 },
    },
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
  it('renders the unified Session Sync card', async () => {
    render(<SettingsView />);
    expect(screen.getByText('Session Sync')).toBeInTheDocument();
    expect(screen.getByText('Sync Sessions')).toBeInTheDocument();
  });

  it('renders the re-classify link', async () => {
    render(<SettingsView />);
    expect(screen.getByText('Re-classify all sessions')).toBeInTheDocument();
  });

  it('shows reclassify confirmation when link clicked', async () => {
    render(<SettingsView />);
    fireEvent.click(screen.getByText('Re-classify all sessions'));

    await waitFor(() => {
      expect(screen.getByText('Re-classify All')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('calls fetch with ?force=true when re-classify confirmed', async () => {
    render(<SettingsView />);
    fireEvent.click(screen.getByText('Re-classify all sessions'));

    await waitFor(() => {
      expect(screen.getByText('Re-classify All')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-classify All'));

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
      expect(calls).toContain('/api/sync?force=true');
    });

    const enrichCall = fetchMock.mock.calls.find((c: unknown[]) => c[0] === '/api/sync?force=true');
    expect(enrichCall?.[1]).toEqual({ method: 'POST' });
  });

  it('shows "Syncing..." while in progress', async () => {
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
    fireEvent.click(screen.getByText('Sync Sessions'));

    await waitFor(() => {
      expect(screen.getByText('Syncing…')).toBeInTheDocument();
    });
  });

  it('renders accordion sections for Phase 2c fields', async () => {
    render(<SettingsView />);
    expect(screen.getByText('Session Types')).toBeInTheDocument();
    expect(screen.getByText('Subtypes')).toBeInTheDocument();
    expect(screen.getByText('Interaction Style')).toBeInTheDocument();
    expect(screen.getByText('Session Metrics')).toBeInTheDocument();
  });

  it('expands and collapses accordion sections on click', async () => {
    render(<SettingsView />);

    // Wait for stats to load so field data is available
    await waitFor(() => {
      expect(screen.getByText('sessions')).toBeInTheDocument();
    });

    // "Interaction Style" section contains a "Delegation" field label when expanded
    // Before clicking, the field label should not be visible
    expect(screen.queryByText('Delegation')).not.toBeInTheDocument();

    // Click the "Interaction Style" accordion header to expand it
    fireEvent.click(screen.getByText('Interaction Style'));

    // After expanding, the field sub-label "Delegation" should appear
    await waitFor(() => {
      expect(screen.getByText('Delegation')).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(screen.getByText('Interaction Style'));

    await waitFor(() => {
      expect(screen.queryByText('Delegation')).not.toBeInTheDocument();
    });
  });

  it('renders field stats inside expanded accordion section', async () => {
    render(<SettingsView />);

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText('sessions')).toBeInTheDocument();
    });

    // Expand "Interaction Style" which contains delegation_style
    fireEvent.click(screen.getByText('Interaction Style'));

    // The FieldStatsTable should render the delegation_style values from mockStatsResult
    // mockStatsResult.fields.delegation_style = { conversational: 6, directive: 8 }
    await waitFor(() => {
      expect(screen.getByText('conversational')).toBeInTheDocument();
      expect(screen.getByText('directive')).toBeInTheDocument();
    });

    // Verify the count values appear in the table
    // "8" for directive, "6" for conversational (also appears elsewhere, so use getAllByText)
    const cells = screen.getAllByText('8');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('renders field delta data after sync in expanded accordion section', async () => {
    render(<SettingsView />);

    // Trigger a sync
    fireEvent.click(screen.getByText('Sync Sessions'));

    // Wait for sync to complete — the sync result summary line shows "classified"
    await waitFor(() => {
      expect(screen.getByText('+2 new')).toBeInTheDocument();
    });

    // Expand "Interaction Style" to see delegation_style field delta table
    fireEvent.click(screen.getByText('Interaction Style'));

    // The FieldDeltaTable should show before/after/delta columns for delegation_style
    // mockSyncResult.fields.delegation_style = { before: { conversational: 5, directive: 7 }, after: { conversational: 6, directive: 8 } }
    await waitFor(() => {
      expect(screen.getByText('conversational')).toBeInTheDocument();
      expect(screen.getByText('directive')).toBeInTheDocument();
    });

    // Verify Before/After/Delta column headers appear (TypeDeltaTable + FieldDeltaTable both have them)
    const beforeHeaders = screen.getAllByText('Before');
    expect(beforeHeaders.length).toBeGreaterThanOrEqual(2); // one from TypeDelta, one from FieldDelta
    const afterHeaders = screen.getAllByText('After');
    expect(afterHeaders.length).toBeGreaterThanOrEqual(2);

    // Verify the section delta badge shows "+2" (gains: +1 conversational, +1 directive)
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
