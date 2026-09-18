export interface DailyExpectation { serviceDate: string; deadlineAt: string; nextDeadlineAt: string }
/** Repeated local minutes use their later occurrence; missing minutes use the next valid minute. */
export function dailyFeedExpectation(schedule: { timeZone: string; deadline: string }, now?: number): DailyExpectation
