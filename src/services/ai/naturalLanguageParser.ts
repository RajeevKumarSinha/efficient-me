import { EnergyLevel, Priority } from '../../types';

export interface ParsedQuickCapture {
  rawInput: string;
  cleanTitle: string;
  energyLevel: EnergyLevel;
  priority: Priority;
  dueDate: string;
  dueTime?: string;
  durationMins?: number;
  isRecurringChore: boolean;
  choreCadence?: 'daily' | 'weekly' | 'monthly' | '3_month' | '6_month' | 'yearly';
  isEscalatingBirthday: boolean;
  detectedTags: Array<{ label: string; icon: string; colorType: 'energy' | 'priority' | 'date' | 'cadence' }>;
}

const MONTH_MAP: Record<string, { index: number; name: string }> = {
  jan: { index: 0, name: 'Jan' },
  january: { index: 0, name: 'Jan' },
  feb: { index: 1, name: 'Feb' },
  february: { index: 1, name: 'Feb' },
  mar: { index: 2, name: 'Mar' },
  march: { index: 2, name: 'Mar' },
  apr: { index: 3, name: 'Apr' },
  april: { index: 3, name: 'Apr' },
  may: { index: 4, name: 'May' },
  jun: { index: 5, name: 'Jun' },
  june: { index: 5, name: 'Jun' },
  jul: { index: 6, name: 'Jul' },
  july: { index: 6, name: 'Jul' },
  aug: { index: 7, name: 'Aug' },
  august: { index: 7, name: 'Aug' },
  sep: { index: 8, name: 'Sep' },
  sept: { index: 8, name: 'Sep' },
  september: { index: 8, name: 'Sep' },
  oct: { index: 9, name: 'Oct' },
  october: { index: 9, name: 'Oct' },
  nov: { index: 10, name: 'Nov' },
  november: { index: 10, name: 'Nov' },
  dec: { index: 11, name: 'Dec' },
  december: { index: 11, name: 'Dec' },
};

const DAY_OF_WEEK_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export function parseNaturalLanguageTask(input: string): ParsedQuickCapture {
  let text = input.trim();
  const detectedTags: ParsedQuickCapture['detectedTags'] = [];

  // Default values
  let energyLevel: EnergyLevel = 2;
  let priority: Priority = 'P3';
  let isRecurringChore = false;
  let choreCadence: ParsedQuickCapture['choreCadence'] = undefined;
  let isEscalatingBirthday = false;
  let durationMins: number | undefined = undefined;
  let dueTime: string | undefined = undefined;

  const today = new Date();
  let targetDate = new Date(today);
  let dateExplicitlyFound = false;

  // 1. Detect Escalating Birthday / Anniversary / Reminder
  if (/\b(birthday|bday|anniversary)\b/i.test(text)) {
    isEscalatingBirthday = true;
    priority = 'P1'; // Birthdays default to P1 for high celebration visibility
    energyLevel = 1; // Gentle energy (it's a celebratory reminder, not a heavy sprint)
    detectedTags.push({ label: 'Birthday Alert', icon: '🎂', colorType: 'priority' });
  }

  // 2. Detect Energy Level (e.g. 1⚡, 2⚡, 3⚡, low energy, high energy, med energy)
  if (/\b(3⚡|3 energy|high energy|deep work|intense|focus 3)\b/i.test(text)) {
    energyLevel = 3;
    text = text.replace(/\b(3⚡|3 energy|high energy|deep work|intense|focus 3)\b/gi, '');
    detectedTags.push({ label: '3⚡ High Energy', icon: '🔥', colorType: 'energy' });
  } else if (/\b(1⚡|1 energy|low energy|gentle|easy|chill|micro)\b/i.test(text)) {
    energyLevel = 1;
    text = text.replace(/\b(1⚡|1 energy|low energy|gentle|easy|chill|micro)\b/gi, '');
    detectedTags.push({ label: '1⚡ Gentle', icon: '🍃', colorType: 'energy' });
  } else if (/\b(2⚡|2 energy|med energy|medium energy|standard)\b/i.test(text)) {
    energyLevel = 2;
    text = text.replace(/\b(2⚡|2 energy|med energy|medium energy|standard)\b/gi, '');
    detectedTags.push({ label: '2⚡ Medium', icon: '⚡', colorType: 'energy' });
  }

  // 3. Detect Priority (P1, P2, P3, P4, urgent, asap)
  if (/\b(p1|priority 1|urgent|asap|critical)\b/i.test(text)) {
    priority = 'P1';
    text = text.replace(/\b(p1|priority 1|urgent|asap|critical)\b/gi, '');
    detectedTags.push({ label: 'Priority P1', icon: '🚨', colorType: 'priority' });
  } else if (/\b(p2|priority 2|high priority)\b/i.test(text)) {
    priority = 'P2';
    text = text.replace(/\b(p2|priority 2|high priority)\b/gi, '');
    detectedTags.push({ label: 'Priority P2', icon: '⭐', colorType: 'priority' });
  } else if (/\b(p4|priority 4|low priority|someday)\b/i.test(text)) {
    priority = 'P4';
    text = text.replace(/\b(p4|priority 4|low priority|someday)\b/gi, '');
    detectedTags.push({ label: 'Priority P4', icon: '💤', colorType: 'priority' });
  } else if (/\b(p3|priority 3)\b/i.test(text)) {
    priority = 'P3';
    text = text.replace(/\b(p3|priority 3)\b/gi, '');
  }

  // 4. Detect Recurrence Cadences
  if (/\b(every day|daily)\b/i.test(text)) {
    isRecurringChore = true;
    choreCadence = 'daily';
    text = text.replace(/\b(every day|daily)\b/gi, '');
    detectedTags.push({ label: 'Daily Chore', icon: '🔄', colorType: 'cadence' });
  } else if (/\b(every week|weekly)\b/i.test(text)) {
    isRecurringChore = true;
    choreCadence = 'weekly';
    text = text.replace(/\b(every week|weekly)\b/gi, '');
    targetDate.setDate(targetDate.getDate() + 7);
    detectedTags.push({ label: 'Weekly Chore', icon: '🔄', colorType: 'cadence' });
    dateExplicitlyFound = true;
  } else if (/\b(every month|monthly)\b/i.test(text)) {
    isRecurringChore = true;
    choreCadence = 'monthly';
    text = text.replace(/\b(every month|monthly)\b/gi, '');
    targetDate.setMonth(targetDate.getMonth() + 1);
    detectedTags.push({ label: 'Monthly Chore', icon: '🔄', colorType: 'cadence' });
    dateExplicitlyFound = true;
  } else if (/\b(every 3 months|quarterly|3 months)\b/i.test(text)) {
    isRecurringChore = true;
    choreCadence = '3_month';
    text = text.replace(/\b(every 3 months|quarterly|3 months)\b/gi, '');
    targetDate.setMonth(targetDate.getMonth() + 3);
    detectedTags.push({ label: 'Quarterly (3 Mo)', icon: '🔄', colorType: 'cadence' });
    dateExplicitlyFound = true;
  } else if (/\b(every 6 months|semi-annually|6 months)\b/i.test(text)) {
    isRecurringChore = true;
    choreCadence = '6_month';
    text = text.replace(/\b(every 6 months|semi-annually|6 months)\b/gi, '');
    targetDate.setMonth(targetDate.getMonth() + 6);
    detectedTags.push({ label: 'Semi-Annual (6 Mo)', icon: '🔄', colorType: 'cadence' });
    dateExplicitlyFound = true;
  } else if (/\b(every year|yearly|annually)\b/i.test(text)) {
    isRecurringChore = true;
    choreCadence = 'yearly';
    text = text.replace(/\b(every year|yearly|annually)\b/gi, '');
    targetDate.setFullYear(targetDate.getFullYear() + 1);
    detectedTags.push({ label: 'Annual Chore', icon: '🔄', colorType: 'cadence' });
    dateExplicitlyFound = true;
  }

  // 5. Detect Full Month + Day Names (e.g. "on May 18", "May 18th", "18 Sep", "September 18", "on 14 Oct")
  if (!dateExplicitlyFound) {
    const monthFirstMatch = text.match(
      /\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    );
    const dayFirstMatch = text.match(
      /\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?[.,]?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i
    );

    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (monthFirstMatch) {
      const monthKey = monthFirstMatch[1].toLowerCase();
      const dayNum = parseInt(monthFirstMatch[2], 10);
      const monthData = MONTH_MAP[monthKey];

      if (monthData && dayNum >= 1 && dayNum <= 31) {
        let year = today.getFullYear();
        let candidate = new Date(year, monthData.index, dayNum);
        // If candidate date already passed this year (e.g. today is Aug 24, and candidate is May 18), target upcoming next year!
        if (candidate < todayNormalized) {
          year += 1;
          candidate = new Date(year, monthData.index, dayNum);
        }
        targetDate = candidate;
        text = text.replace(monthFirstMatch[0], '');
        detectedTags.push({ label: `${monthData.name} ${dayNum}`, icon: '📅', colorType: 'date' });
        dateExplicitlyFound = true;
      }
    } else if (dayFirstMatch) {
      const dayNum = parseInt(dayFirstMatch[1], 10);
      const monthKey = dayFirstMatch[2].toLowerCase();
      const monthData = MONTH_MAP[monthKey];

      if (monthData && dayNum >= 1 && dayNum <= 31) {
        let year = today.getFullYear();
        let candidate = new Date(year, monthData.index, dayNum);
        if (candidate < todayNormalized) {
          year += 1;
          candidate = new Date(year, monthData.index, dayNum);
        }
        targetDate = candidate;
        text = text.replace(dayFirstMatch[0], '');
        detectedTags.push({ label: `${monthData.name} ${dayNum}`, icon: '📅', colorType: 'date' });
        dateExplicitlyFound = true;
      }
    }
  }

  // 6. Detect Relative Dates (e.g. tomorrow, in X days, next monday, this friday)
  if (!dateExplicitlyFound) {
    if (/\b(tomorrow)\b/i.test(text)) {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
      text = text.replace(/\b(tomorrow)\b/gi, '');
      detectedTags.push({ label: 'Tomorrow', icon: '📅', colorType: 'date' });
      dateExplicitlyFound = true;
    } else if (/\b(today)\b/i.test(text)) {
      targetDate = new Date(today);
      text = text.replace(/\b(today)\b/gi, '');
      detectedTags.push({ label: 'Today', icon: '📅', colorType: 'date' });
      dateExplicitlyFound = true;
    } else {
      const inDaysMatch = text.match(/\bin (\d+) days?\b/i);
      const inWeeksMatch = text.match(/\bin (\d+) weeks?\b/i);
      const weekdayMatch = text.match(/\b(?:next\s+|this\s+|on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);

      if (inDaysMatch) {
        const daysToAdd = parseInt(inDaysMatch[1], 10);
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        text = text.replace(inDaysMatch[0], '');
        detectedTags.push({ label: `In ${daysToAdd}d`, icon: '📅', colorType: 'date' });
        dateExplicitlyFound = true;
      } else if (inWeeksMatch) {
        const weeksToAdd = parseInt(inWeeksMatch[1], 10);
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + weeksToAdd * 7);
        text = text.replace(inWeeksMatch[0], '');
        detectedTags.push({ label: `In ${weeksToAdd}w`, icon: '📅', colorType: 'date' });
        dateExplicitlyFound = true;
      } else if (weekdayMatch) {
        const targetDayOfWeek = DAY_OF_WEEK_MAP[weekdayMatch[1].toLowerCase()];
        if (targetDayOfWeek !== undefined) {
          const currentDay = today.getDay();
          let diff = targetDayOfWeek - currentDay;
          if (diff <= 0) diff += 7; // Target upcoming day
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() + diff);
          text = text.replace(weekdayMatch[0], '');
          const capDay = weekdayMatch[1].charAt(0).toUpperCase() + weekdayMatch[1].slice(1, 3);
          detectedTags.push({ label: capDay, icon: '📅', colorType: 'date' });
          dateExplicitlyFound = true;
        }
      }
    }
  }

  // 7. Detect Time (e.g. at 10am, at 2:30pm, at 14:00)
  const timeMatch = text.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    dueTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    text = text.replace(timeMatch[0], '');
    detectedTags.push({ label: dueTime, icon: '⏰', colorType: 'date' });
  }

  // 8. Detect Duration (e.g. for 20m, 50 mins, 1 hour)
  const durationMatch = text.match(/\b(?:for )?(\d+)\s*(?:mins?|m|minutes?|hours?|hrs?)\b/i);
  if (durationMatch) {
    const val = parseInt(durationMatch[1], 10);
    durationMins = /hour|hr/i.test(durationMatch[0]) ? val * 60 : val;
    text = text.replace(durationMatch[0], '');
    detectedTags.push({ label: `${durationMins}m`, icon: '⏱️', colorType: 'date' });
  }

  // Clean trailing/leading prepositions, spaces, and punctuation
  const cleanTitle =
    text
      .replace(/\s+(on|at|for|by|every)\s*$/gi, '')
      .replace(/^\s*(on|at|for|by|every)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/^[,;.\s-]+/, '')
      .replace(/[,;.\s-]+$/, '')
      .trim() || input.trim();

  // Format date YYYY-MM-DD cleanly using local date components
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dueDateStr = `${yyyy}-${mm}-${dd}`;

  return {
    rawInput: input,
    cleanTitle: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
    energyLevel,
    priority,
    dueDate: dueDateStr,
    dueTime,
    durationMins,
    isRecurringChore,
    choreCadence,
    isEscalatingBirthday,
    detectedTags,
  };
}
