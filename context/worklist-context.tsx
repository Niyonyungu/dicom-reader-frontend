'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorklistItem, mockWorklist } from '@/lib/mock-data';

interface WorklistContextType {
  worklist: WorklistItem[];
  addWorklistItem: (item: WorklistItem) => void;
  updateWorklistItem: (id: string, item: Partial<WorklistItem>) => void;
  getWorklistItem: (id: string) => WorklistItem | undefined;
  filterWorklist: (
    modality?: string,
    status?: string,
    searchText?: string
  ) => WorklistItem[];
}

const WorklistContext = createContext<WorklistContextType | undefined>(
  undefined
);

export function WorklistProvider({ children }: { children: ReactNode }) {
  const [worklist, setWorklist] = useState<WorklistItem[]>(mockWorklist);

  const addWorklistItem = (item: WorklistItem) => {
    setWorklist([...worklist, item]);
  };

  const updateWorklistItem = (id: string, item: Partial<WorklistItem>) => {
    setWorklist((prevWorklist) =>
      prevWorklist.map((w) => (w.id === id ? { ...w, ...item } : w))
    );
  };

  const getWorklistItem = (id: string) => {
    return worklist.find((w) => w.id === id);
  };

  const filterWorklist = (
    modality?: string,
    status?: string,
    searchText?: string
  ) => {
    return worklist.filter((item) => {
      if (modality && item.modality !== modality) return false;
      if (status && item.status !== status) return false;
      if (
        searchText &&
        !item.patientName.toLowerCase().includes(searchText.toLowerCase()) &&
        !item.patientId.toLowerCase().includes(searchText.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  return (
    <WorklistContext.Provider
      value={{
        worklist,
        addWorklistItem,
        updateWorklistItem,
        getWorklistItem,
        filterWorklist
      }}
    >
      {children}
    </WorklistContext.Provider>
  );
}

export function useWorklist() {
  const context = useContext(WorklistContext);
  if (context === undefined) {
    throw new Error('useWorklist must be used within a WorklistProvider');
  }
  return context;
}
