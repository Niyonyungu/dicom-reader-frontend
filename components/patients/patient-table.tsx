'use client';

import { Patient } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PatientTableProps {
  patients: Patient[];
  onEdit?: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
}

export function PatientTable({
  patients,
  onEdit,
  onDelete,
}: PatientTableProps) {
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No patients found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Patient ID
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Age
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Gender
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              DOB
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Contact
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Email
            </th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              className="border-b border-border hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 text-foreground font-medium">
                {patient.id}
              </td>
              <td className="px-4 py-3 text-foreground">{patient.name}</td>
              <td className="px-4 py-3 text-foreground">
                {calculateAge(patient.dob)} yrs
              </td>
              <td className="px-4 py-3 text-foreground">{patient.gender}</td>
              <td className="px-4 py-3 text-foreground">{patient.dob}</td>
              <td className="px-4 py-3 text-foreground">{patient.contactInfo}</td>
              <td className="px-4 py-3 text-foreground text-xs">{patient.email}</td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(patient)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(patient.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
