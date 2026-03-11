'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, mockPatients } from '@/lib/mock-data';

interface PatientsContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  getPatient: (id: string) => Patient | undefined;
  deletePatient: (id: string) => void;
  searchPatients: (searchText: string) => Patient[];
}

const PatientsContext = createContext<PatientsContextType | undefined>(
  undefined
);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);

  const addPatient = (patient: Patient) => {
    setPatients([...patients, patient]);
  };

  const updatePatient = (id: string, patient: Partial<Patient>) => {
    setPatients(
      patients.map((p) => (p.id === id ? { ...p, ...patient } : p))
    );
  };

  const getPatient = (id: string) => {
    return patients.find((p) => p.id === id);
  };

  const deletePatient = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
  };

  const searchPatients = (searchText: string) => {
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchText.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchText.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  return (
    <PatientsContext.Provider
      value={{
        patients,
        addPatient,
        updatePatient,
        getPatient,
        deletePatient,
        searchPatients
      }}
    >
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientsContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
}
