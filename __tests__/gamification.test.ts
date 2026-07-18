// A dummy test for the infrastructure
describe('Gamification Logic', () => {
  it('should calculate the correct level for 0 XP', () => {
    const xp = 0;
    const level = Math.floor(xp / 100);
    expect(level).toBe(0);
  });

  it('should calculate the correct level for 250 XP', () => {
    const xp = 250;
    const level = Math.floor(xp / 100);
    expect(level).toBe(2);
  });
});
