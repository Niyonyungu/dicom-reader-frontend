'use client';

import { useState } from 'react';
import { Patient } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patient: Patient) => void;
  existingPatients?: Patient[];
}

export function AddPatientModal({
  open,
  onOpenChange,
  onSubmit,
  existingPatients = [],
}: AddPatientModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    age: '',
    gender: 'M' as 'M' | 'F' | 'O',
    dob: '',
    contactInfo: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatePatientId = () => {
    const maxId = Math.max(
      0,
      ...existingPatients.map((p) => parseInt(p.id.replace('P', '')) || 0)
    );
    return `P${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.dob) newErrors.dob = 'DOB is required';
    if (!formData.contactInfo.trim()) newErrors.contactInfo = 'Contact is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newPatient: Patient = {
      id: formData.id || generatePatientId(),
      name: formData.name,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      dob: formData.dob,
      contactInfo: formData.contactInfo,
      email: formData.email,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSubmit(newPatient);
    setFormData({
      id: '',
      name: '',
      age: '',
      gender: 'M',
      dob: '',
      contactInfo: '',
      email: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter patient information to add them to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-input border-border"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) =>
                setFormData({ ...formData, gender: v as 'M' | 'F' | 'O' })
              }>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                className="bg-input border-border"
              />
              {errors.dob && (
                <p className="text-xs text-destructive">{errors.dob}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact *</Label>
              <Input
                id="contact"
                placeholder="Phone number"
                value={formData.contactInfo}
                onChange={(e) =>
                  setFormData({ ...formData, contactInfo: e.target.value })
                }
                className="bg-input border-border"
              />
              {errors.contactInfo && (
                <p className="text-xs text-destructive">{errors.contactInfo}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-input border-border"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Add Patient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
