export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEvent {
    timestamp: string;
    level: LogLevel;
    event: string;
    analysisId?: string;
    message: string;
    details?: Record<string, string | number | boolean>;
}

export function log(
    level: LogLevel,
    event: string,
    message: string,
    details?: LogEvent['details'],
    analysisId?: string
): LogEvent {
    const entry: LogEvent = {
        timestamp: new Date().toISOString(),
        level,
        event,
        message,
        ...(analysisId ? { analysisId } : {}),
        ...(details ? { details } : {}),
    };
    (level === 'error' ? console.error : console.log)(JSON.stringify(entry));
    return entry;
}
