'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Report, mockReports } from '@/lib/mock-data';

interface ReportsContextType {
  reports: Report[];
  addReport: (report: Report) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  getReport: (id: string) => Report | undefined;
  getReportsByPatient: (patientId: string) => Report[];
  getReportsByWorklist: (worklistId: string) => Report | undefined;
  deleteReport: (id: string) => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(
  undefined
);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(mockReports);

  const addReport = (report: Report) => {
    setReports([...reports, report]);
  };

  const updateReport = (id: string, report: Partial<Report>) => {
    setReports(
      reports.map((r) => (r.id === id ? { ...r, ...report } : r))
    );
  };

  const getReport = (id: string) => {
    return reports.find((r) => r.id === id);
  };

  const getReportsByPatient = (patientId: string) => {
    return reports.filter((r) => r.patientId === patientId);
  };

  const getReportsByWorklist = (worklistId: string) => {
    return reports.find((r) => r.worklistId === worklistId);
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter((r) => r.id !== id));
  };

  return (
    <ReportsContext.Provider
      value={{
        reports,
        addReport,
        updateReport,
        getReport,
        getReportsByPatient,
        getReportsByWorklist,
        deleteReport
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
}
