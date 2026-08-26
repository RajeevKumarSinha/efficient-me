import { parseNaturalLanguageTask } from '../naturalLanguageParser';

describe('Natural Language Task Parser', () => {
  describe('Energy Level Detection', () => {
    it('should parse 1⚡ / low energy / gentle as energy level 1', () => {
      const result1 = parseNaturalLanguageTask('Review light notes 1⚡');
      expect(result1.energyLevel).toBe(1);
      expect(result1.cleanTitle).toBe('Review light notes');

      const result2 = parseNaturalLanguageTask('Organize bookmarks low energy');
      expect(result2.energyLevel).toBe(1);
      expect(result2.cleanTitle).toBe('Organize bookmarks');

      const result3 = parseNaturalLanguageTask('Quick stretch gentle');
      expect(result3.energyLevel).toBe(1);
    });

    it('should parse 2⚡ / medium energy / standard as energy level 2', () => {
      const result1 = parseNaturalLanguageTask('Write email draft 2⚡');
      expect(result1.energyLevel).toBe(2);
      expect(result1.cleanTitle).toBe('Write email draft');

      const result2 = parseNaturalLanguageTask('Team sync medium energy');
      expect(result2.energyLevel).toBe(2);
      expect(result2.cleanTitle).toBe('Team sync');
    });

    it('should parse 3⚡ / high energy / deep work as energy level 3', () => {
      const result1 = parseNaturalLanguageTask('Refactor SQLite migrations 3⚡');
      expect(result1.energyLevel).toBe(3);
      expect(result1.cleanTitle).toBe('Refactor SQLite migrations');

      const result2 = parseNaturalLanguageTask('Design system architecture deep work');
      expect(result2.energyLevel).toBe(3);
      expect(result2.cleanTitle).toBe('Design system architecture');

      const result3 = parseNaturalLanguageTask('Debug complex race condition high energy');
      expect(result3.energyLevel).toBe(3);
    });
  });

  describe('Priority Detection', () => {
    it('should parse P1 / urgent / critical as P1', () => {
      const result1 = parseNaturalLanguageTask('Fix production outage P1');
      expect(result1.priority).toBe('P1');
      expect(result1.cleanTitle).toBe('Fix production outage');

      const result2 = parseNaturalLanguageTask('Submit tax filing urgent');
      expect(result2.priority).toBe('P1');
      expect(result2.cleanTitle).toBe('Submit tax filing');
    });

    it('should parse P2 / high priority as P2', () => {
      const result1 = parseNaturalLanguageTask('Review sprint PRs P2');
      expect(result1.priority).toBe('P2');
      expect(result1.cleanTitle).toBe('Review sprint PRs');
    });

    it('should parse P4 / someday / low priority as P4', () => {
      const result1 = parseNaturalLanguageTask('Explore new Rust framework P4');
      expect(result1.priority).toBe('P4');
      expect(result1.cleanTitle).toBe('Explore new Rust framework');

      const result2 = parseNaturalLanguageTask('Read sci-fi book someday');
      expect(result2.priority).toBe('P4');
    });
  });

  describe('Recurrence & Cadences', () => {
    it('should detect daily chores', () => {
      const result = parseNaturalLanguageTask('Wipe kitchen counters daily');
      expect(result.isRecurringChore).toBe(true);
      expect(result.choreCadence).toBe('daily');
      expect(result.cleanTitle).toBe('Wipe kitchen counters');
    });

    it('should detect weekly chores', () => {
      const result = parseNaturalLanguageTask('Clean bathroom weekly');
      expect(result.isRecurringChore).toBe(true);
      expect(result.choreCadence).toBe('weekly');
    });

    it('should detect monthly chores', () => {
      const result = parseNaturalLanguageTask('Monthly Subscriptions Audit');
      expect(result.isRecurringChore).toBe(true);
      expect(result.choreCadence).toBe('monthly');
    });

    it('should detect quarterly (3-month) chores', () => {
      const result = parseNaturalLanguageTask('Replace HVAC AC Filters quarterly');
      expect(result.isRecurringChore).toBe(true);
      expect(result.choreCadence).toBe('3_month');
    });
  });

  describe('Escalating Birthdays & Anniversaries', () => {
    it('should accurately parse birthday with title and strip metadata tokens', () => {
      const result = parseNaturalLanguageTask('Tanishkas birthday on May 18th P1');
      expect(result.isEscalatingBirthday).toBe(true);
      expect(result.priority).toBe('P1');
      expect(result.energyLevel).toBe(1); // Gentle celebration reminder
      expect(result.cleanTitle).toBe('Tanishkas birthday');
      expect(result.dueDate).toMatch(/-05-18$/);
    });

    it('should accurately parse anniversary with date', () => {
      const result = parseNaturalLanguageTask("Parents anniversary on Sep 18");
      expect(result.isEscalatingBirthday).toBe(true);
      expect(result.cleanTitle).toBe("Parents anniversary");
      expect(result.dueDate).toMatch(/-09-18$/);
    });

    it('should parse Mom birthday on Oct 14', () => {
      const result = parseNaturalLanguageTask("Mom's birthday Oct 14th");
      expect(result.isEscalatingBirthday).toBe(true);
      expect(result.dueDate).toMatch(/-10-14$/);
    });
  });

  describe('Relative Dates', () => {
    it('should detect today and tomorrow', () => {
      const today = new Date().toISOString().split('T')[0];
      const resToday = parseNaturalLanguageTask('Submit report today');
      expect(resToday.dueDate).toBe(today);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = tomorrow.toISOString().split('T')[0];
      const resTomorrow = parseNaturalLanguageTask('Prepare presentation tomorrow');
      expect(resTomorrow.dueDate).toBe(tomorrowIso);
    });

    it('should detect relative days of week', () => {
      const result = parseNaturalLanguageTask('Team retrospective next Friday');
      expect(result.dueDate).toBeTruthy();
      expect(result.detectedTags.some((t) => t.colorType === 'date')).toBe(true);
    });
  });

  describe('Edge Cases & Sanitization', () => {
    it('should handle empty input gracefully', () => {
      const result = parseNaturalLanguageTask('');
      expect(result.cleanTitle).toBe('');
      expect(result.energyLevel).toBe(2);
      expect(result.priority).toBe('P3');
      expect(result.isRecurringChore).toBe(false);
      expect(result.isEscalatingBirthday).toBe(false);
    });

    it('should handle multiple metadata tags combined in one string', () => {
      const result = parseNaturalLanguageTask('Deep refactoring sprint 3⚡ P1 urgent due tomorrow');
      expect(result.energyLevel).toBe(3);
      expect(result.priority).toBe('P1');
      expect(result.cleanTitle).toBe('Deep refactoring sprint');
    });
  });
});
