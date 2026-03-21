/**
 * Comprehensive Audit Logging System
 * Tracks all user actions for compliance, quality assurance, and service role auditing
 */

export enum AuditEventType {
  // Authentication & Access
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Study Management
  STUDY_OPENED = 'STUDY_OPENED',
  STUDY_CLOSED = 'STUDY_CLOSED',
  STUDY_EXPORTED = 'STUDY_EXPORTED',

  // Image Viewing
  IMAGE_VIEWED = 'IMAGE_VIEWED',
  IMAGE_MARKED_KEY = 'IMAGE_MARKED_KEY',
  IMAGE_CAPTURED = 'IMAGE_CAPTURED',

  // Measurements & Annotations
  MEASUREMENT_CREATED = 'MEASUREMENT_CREATED',
  MEASUREMENT_DELETED = 'MEASUREMENT_DELETED',
  ANNOTATION_CREATED = 'ANNOTATION_CREATED',
  ANNOTATION_DELETED = 'ANNOTATION_DELETED',
  ROI_ANALYSIS = 'ROI_ANALYSIS',

  // Image Processing
  WINDOW_LEVEL_ADJUSTED = 'WINDOW_LEVEL_ADJUSTED',
  IMAGE_FILTER_APPLIED = 'IMAGE_FILTER_APPLIED',
  IMAGE_ROTATED = 'IMAGE_ROTATED',

  // Report Generation
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_FINALIZED = 'REPORT_FINALIZED',
  REPORT_SIGNED = 'REPORT_SIGNED',

  // Data Access
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  QUERY_EXECUTED = 'QUERY_EXECUTED',

  // System Events
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
  OFFLINE_SYNC = 'OFFLINE_SYNC',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userRole: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  description: string;
  studyId?: string;
  seriesId?: string;
  imageId?: string;
  measurementId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  status: 'success' | 'failure';
  errorMessage?: string;
  duration?: number; // milliseconds
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLocalLogs = 1000;
  private isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  private pendingSyncQueue: AuditLog[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      this.loadFromStorage();
    }
  }

  /**
   * Log an audit event with comprehensive context
   */
  public log(
    eventType: AuditEventType,
    description: string,
    options: Partial<AuditLog> = {}
  ): AuditLog {
    const auditLog: AuditLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      userId: options.userId || this.getCurrentUserId(),
      userRole: options.userRole || this.getUserRole(),
      eventType,
      severity: options.severity || AuditSeverity.INFO,
      description,
      status: 'success',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...options,
    };

    this.logs.push(auditLog);
    this.trimLocalLogs();
    this.saveToStorage();

    // Try to sync if online
    if (this.isOnline && !options.metadata?.offline) {
      this.syncLog(auditLog);
    } else {
      this.pendingSyncQueue.push(auditLog);
    }

    return auditLog;
  }

  /**
   * Log measurement creation
   */
  public logMeasurement(
    measurementId: string,
    type: string,
    value: number,
    imageId: string,
    studyId?: string
  ): AuditLog {
    return this.log(
      AuditEventType.MEASUREMENT_CREATED,
      `Measurement created: ${type} = ${value.toFixed(2)}`,
      {
        measurementId,
        imageId,
        studyId,
        metadata: { measurementType: type, value },
      }
    );
  }

  /**
   * Log ROI analysis
   */
  public logROIAnalysis(
    roiId: string,
    statistics: Record<string, number>,
    imageId: string,
    studyId?: string
  ): AuditLog {
    return this.log(
      AuditEventType.ROI_ANALYSIS,
      `ROI analysis performed on image`,
      {
        imageId,
        studyId,
        metadata: { roiId, statistics },
      }
    );
  }

  /**
   * Log study access
   */
  public logStudyAccess(
    studyId: string,
    patientId: string,
    modality: string
  ): AuditLog {
    return this.log(
      AuditEventType.STUDY_OPENED,
      `Study opened: ${modality} for patient ${patientId}`,
      {
        studyId,
        metadata: { patientId, modality },
      }
    );
  }

  /**
   * Log report generation
   */
  public logReportGeneration(
    studyId: string,
    reportType: string,
    findings: string
  ): AuditLog {
    return this.log(
      AuditEventType.REPORT_GENERATED,
      `Report generated: ${reportType}`,
      {
        studyId,
        severity: AuditSeverity.INFO,
        metadata: { reportType, findingsLength: findings.length },
      }
    );
  }

  /**
   * Log error events
   */
  public logError(
    error: Error | string,
    context: string,
    studyId?: string
  ): AuditLog {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return this.log(
      AuditEventType.ERROR_OCCURRED,
      `Error in ${context}: ${errorMessage}`,
      {
        studyId,
        severity: AuditSeverity.ERROR,
        status: 'failure',
        errorMessage: errorMessage,
        metadata: { context, stack: error instanceof Error ? error.stack : undefined },
      }
    );
  }

  /**
   * Get logs for a specific study
   */
  public getStudyLogs(studyId: string): AuditLog[] {
    return this.logs.filter(log => log.studyId === studyId);
  }

  /**
   * Get logs for a specific user
   */
  public getUserLogs(userId: string): AuditLog[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get logs by severity level
   */
  public getLogsBySeverity(severity: AuditSeverity): AuditLog[] {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Get logs within a time range
   */
  public getLogsByTimeRange(startTime: number, endTime: number): AuditLog[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * Export logs to CSV format
   */
  public exportToCSV(): string {
    const headers = [
      'Timestamp',
      'User ID',
      'User Role',
      'Event Type',
      'Severity',
      'Description',
      'Study ID',
      'Status',
    ];
    const rows = this.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.userId,
      log.userRole,
      log.eventType,
      log.severity,
      log.description,
      log.studyId || 'N/A',
      log.status,
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    return csv;
  }

  /**
   * Handle online status
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.syncPendingLogs();
  }

  /**
   * Handle offline status
   */
  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Sync pending logs when coming back online
   */
  private async syncPendingLogs(): Promise<void> {
    if (this.pendingSyncQueue.length === 0) return;

    const queue = [...this.pendingSyncQueue];
    this.pendingSyncQueue = [];

    for (const log of queue) {
      try {
        await this.syncLog(log);
      } catch (error) {
        // Put it back in the queue if sync fails
        this.pendingSyncQueue.push(log);
      }
    }
  }

  /**
   * Sync individual log to server
   */
  private async syncLog(log: AuditLog): Promise<void> {
    // This would call your backend API endpoint
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync log: ${response.statusText}`);
      }

      this.log(
        AuditEventType.OFFLINE_SYNC,
        'Audit log synced to server',
        { metadata: { offline: true, logId: log.id } }
      );
    } catch (error) {
      // Keep in sync queue for retry
      this.pendingSyncQueue.push(log);
    }
  }

  /**
   * Save logs to local storage
   */
  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const logsToStore = this.logs.slice(-this.maxLocalLogs);
        localStorage.setItem('auditLogs', JSON.stringify(logsToStore));
      }
    } catch (error) {
      console.error('Failed to save audit logs to storage:', error);
    }
  }

  /**
   * Load logs from local storage
   */
  private loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('auditLogs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error);
    }
  }

  /**
   * Trim local logs to max size
   */
  private trimLocalLogs(): void {
    if (this.logs.length > this.maxLocalLogs) {
      this.logs = this.logs.slice(-this.maxLocalLogs);
    }
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID from session/context
   */
  private getCurrentUserId(): string {
    if (typeof window !== 'undefined' && (window as any).__authContext?.userId) {
      return (window as any).__authContext.userId;
    }
    return localStorage?.getItem('userId') || 'anonymous';
  }

  /**
   * Get user role from session/context
   */
  private getUserRole(): string {
    if (typeof window !== 'undefined' && (window as any).__authContext?.role) {
      return (window as any).__authContext.role;
    }
    return localStorage?.getItem('userRole') || 'viewer';
  }

  /**
   * Clear all logs (for testing)
   */
  public clearLogs(): void {
    this.logs = [];
    this.pendingSyncQueue = [];
    this.saveToStorage();
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Export for use in components
export default auditLogger;
