import { getAiProvider, UnavailableAiProvider } from '../src/ai/provider';

describe('AiProvider placeholder', () => {
  it('ships only the offline unavailable provider', async () => {
    const p = getAiProvider();
    expect(p).toBeInstanceOf(UnavailableAiProvider);
    expect(p.id).toBe('unavailable');
    expect(p.requiresNetwork).toBe(false);
    expect(await p.isAvailable()).toBe(false);
    await expect(p.complete({ messages: [] })).rejects.toThrow(/not enabled/i);
  });
});
