import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Create mocks for window functions
const mockScrollTo = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockRequestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  return setTimeout(() => cb(Date.now()), 16) as any;
});
const mockCancelAnimationFrame = vi.fn((id: any) => {
  clearTimeout(id);
});

// Stub the globals so they are available in Node.js test environment
vi.stubGlobal("window", {
  scrollY: 100,
  scrollTo: mockScrollTo,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  requestAnimationFrame: mockRequestAnimationFrame,
  cancelAnimationFrame: mockCancelAnimationFrame,
});

vi.stubGlobal("document", {
  documentElement: {
    scrollTop: 100,
  },
});

vi.stubGlobal("requestAnimationFrame", mockRequestAnimationFrame);
vi.stubGlobal("cancelAnimationFrame", mockCancelAnimationFrame);

import { easeInOutCubic, calculateScrollPercentage, animateScrollTo } from "../scroll";

describe("scroll utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockScrollTo.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    mockRequestAnimationFrame.mockClear();
    mockCancelAnimationFrame.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("easeInOutCubic", () => {
    it("returns 0 when t is 0", () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it("returns 1 when t is 1", () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it("calculates values correctly in middle", () => {
      expect(easeInOutCubic(0.25)).toBe(0.0625);
      expect(easeInOutCubic(0.5)).toBe(0.5);
      expect(easeInOutCubic(0.75)).toBe(0.9375);
    });
  });

  describe("calculateScrollPercentage", () => {
    it("returns 0 if documentHeight <= windowHeight", () => {
      expect(calculateScrollPercentage(100, 500, 600)).toBe(0);
      expect(calculateScrollPercentage(100, 500, 500)).toBe(0);
    });

    it("calculates percentage correctly inside bounds", () => {
      // scrollY=250, documentHeight=1000, windowHeight=500 => maxScroll=500. progress = 250/500 = 0.5
      expect(calculateScrollPercentage(250, 1000, 500)).toBe(0.5);
      // scrollY=0, documentHeight=1000, windowHeight=500 => 0
      expect(calculateScrollPercentage(0, 1000, 500)).toBe(0);
      // scrollY=500, documentHeight=1000, windowHeight=500 => 1
      expect(calculateScrollPercentage(500, 1000, 500)).toBe(1);
    });

    it("caps percentage between 0 and 1", () => {
      expect(calculateScrollPercentage(-10, 1000, 500)).toBe(0);
      expect(calculateScrollPercentage(600, 1000, 500)).toBe(1);
    });
  });

  describe("animateScrollTo", () => {
    it("performs scrolling and calls onComplete", async () => {
      const onComplete = vi.fn();
      
      // Animate scroll to 0 over 100ms
      animateScrollTo(0, 100, onComplete);

      // Advance timers to trigger animation frames
      await vi.advanceTimersByTimeAsync(120);

      expect(mockScrollTo).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it("adds and removes event listeners for canceling scroll", async () => {
      const cancelFn = animateScrollTo(0, 100);

      expect(mockAddEventListener).toHaveBeenCalledWith("wheel", expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith("touchmove", expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith("keydown", expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith("mousedown", expect.any(Function), { passive: true });

      // Explicitly cancel the animation
      cancelFn();

      expect(mockRemoveEventListener).toHaveBeenCalledWith("wheel", expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith("touchmove", expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith("mousedown", expect.any(Function));
    });
  });
});
