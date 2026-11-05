import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openF1Api } from './openf1.api';

const fetchMock = vi.fn();

const response = (status: number, body: unknown = [], headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

describe('openF1Api', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should try again, when OpenF1 refuses a request for too many requests', async () => {
    fetchMock.mockResolvedValueOnce(response(429, { detail: 'Too many requests' }, { 'retry-after': '2' })).mockResolvedValueOnce(response(200, [{ lap_number: 1 }]));

    const laps = openF1Api.labs('token', 11404);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(laps).resolves.toEqual([{ lap_number: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should give up, when OpenF1 keeps refusing', async () => {
    fetchMock.mockImplementation(async () => response(429));

    const laps = openF1Api.labs('token', 11404);
    const failed = expect(laps).rejects.toThrow('429');
    await vi.runAllTimersAsync();

    await failed;
    // The first request and four retries
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('should not try again on other errors', async () => {
    fetchMock.mockResolvedValue(response(500));

    await expect(openF1Api.labs('token', 11404)).rejects.toThrow('500');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
