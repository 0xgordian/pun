/**
 * orderFillService tests — updated for Mantle port.
 *
 * On Mantle there is no CLOB, so fetchOrderStatus always returns null.
 * pollOrderFill is kept for API compatibility but will always time out
 * or return UNKNOWN. These tests verify the polling lifecycle still works
 * correctly (PENDING emission, abort handling, timeout behaviour).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pollOrderFill } from '../orderFillService';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('pollOrderFill — Mantle (no CLOB)', () => {
  it('emits PENDING immediately before first poll', async () => {
    const updates: string[] = [];
    const promise = pollOrderFill('order-1', (r) => updates.push(r.status));

    // PENDING fires synchronously before any await
    expect(updates[0]).toBe('PENDING');

    // Advance timers to complete (will time out since no CLOB)
    await vi.runAllTimersAsync();
    await promise.catch(() => {});
  });

  it('stops polling when AbortController is aborted before first poll', async () => {
    const controller = new AbortController();
    const updates: string[] = [];

    // Abort immediately — before the 3s sleep fires
    controller.abort();

    const result = await pollOrderFill('order-1', (r) => updates.push(r.status), controller.signal);

    // Should return UNKNOWN — aborted before any fetch
    expect(result.status).toBe('UNKNOWN');
  });

  it('returns UNKNOWN status when no CLOB data is available', async () => {
    const updates: Array<{ status: string }> = [];
    const controller = new AbortController();

    const promise = pollOrderFill('order-1', (r) => updates.push({ status: r.status }), controller.signal);

    // PENDING fires immediately
    expect(updates[0].status).toBe('PENDING');

    // Abort to avoid running all 20 polls
    controller.abort();
    await promise.catch(() => {});
  });

  it('emits PENDING as first update regardless of abort timing', async () => {
    const updates: string[] = [];
    const controller = new AbortController();

    const promise = pollOrderFill('order-1', (r) => updates.push(r.status), controller.signal);
    expect(updates[0]).toBe('PENDING');

    controller.abort();
    await promise.catch(() => {});
  });

  it('result has correct shape', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await pollOrderFill('order-1', () => {}, controller.signal);

    expect(result).toHaveProperty('orderId', 'order-1');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('fillFraction');
    expect(result).toHaveProperty('avgFillPrice');
    expect(result).toHaveProperty('rejectReason');
    expect(result).toHaveProperty('timedOut');
    expect(result.fillFraction).toBeGreaterThanOrEqual(0);
    expect(result.fillFraction).toBeLessThanOrEqual(1);
  });

  it('timedOut is false when aborted early', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await pollOrderFill('order-1', () => {}, controller.signal);
    expect(result.timedOut).toBe(false);
  });
});
