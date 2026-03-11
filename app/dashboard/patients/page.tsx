'use client';

import { useState, useMemo } from 'react';
import { usePatients } from '@/context/patients-context';
import { Patient } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PatientTable } from '@/components/patients/patient-table';
import { AddPatientModal } from '@/components/patients/add-patient-modal';
import { Search, Plus, Users } from 'lucide-react';

export default function PatientsPage() {
  const { patients, addPatient, deletePatient } = usePatients();
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.id.toLowerCase().includes(searchText.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [patients, searchText]);

  const handleAddPatient = (patient: Patient) => {
    addPatient(patient);
  };

  const handleDeletePatient = (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      deletePatient(patientId);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          </div>
          <p className="text-muted-foreground">
            Manage patient information and records
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">
            All Patients ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientTable
            patients={filteredPatients}
            onDelete={handleDeletePatient}
          />
        </CardContent>
      </Card>

      {/* Add Patient Modal */}
      <AddPatientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddPatient}
        existingPatients={patients}
      />
    </div>
  );
}
