"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Edit2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    Patient,
} from "@/services/patients-service";
import { handleApiError } from "@/lib/api-error-handler";

/**
 * Patient Detail Page
 * View and edit individual patient information
 */
export default function PatientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { can } = useAuth();
    const patientId = params.id as string;
    const isNew = patientId === "new";

    // State
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(!isNew);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(isNew);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        patient_id: "",
        full_name: "",
        date_of_birth: "",
        gender: "",
        contact_info: "",
        email: "",
        weight_kg: "",
        height_cm: "",
        medical_record_number: "",
    });

    // Fetch patient
    useEffect(() => {
        const fetchPatient = async () => {
            if (isNew) return;

            try {
                setLoading(true);
                setError(null);
                const data = await getPatient(patientId);
                setPatient(data);
                setFormData({
                    patient_id: data.patient_id || data.id,
                    full_name: data.full_name || data.name,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender || "",
                    contact_info: data.contact_info || "",
                    email: data.email || "",
                    weight_kg: data.weight_kg ? data.weight_kg.toString() : "",
                    height_cm: data.height_cm ? data.height_cm.toString() : "",
                    medical_record_number: data.medical_record_number || "",
                });
            } catch (err) {
                setError(handleApiError(err).message);
            } finally {
                setLoading(false);
            }
        };

        if (patientId) {
            fetchPatient();
        }
    }, [patientId, isNew]);

    // Handle save (create or update)
    const handleSave = async () => {
        try {
            setSubmitting(true);
            setError(null);

            const payload: any = {
                full_name: formData.full_name,
                name: formData.full_name, // Send both to be safe
                date_of_birth: formData.date_of_birth,
                gender: (formData.gender as "M" | "F" | "O") || null,
                contact_info: formData.contact_info || null,
                email: formData.email || null,
                weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
                height_cm: formData.height_cm ? Number(formData.height_cm) : null,
                medical_record_number: formData.medical_record_number || null,
            };

            if (isNew) {
                payload.patient_id = formData.patient_id;
                const created = await createPatient(payload);
                toast.success("Patient created successfully");
                router.push(`/dashboard/patients/${created.id}`);
            } else {
                await updatePatient(patientId, payload);
                // Refresh patient
                const updated = await getPatient(patientId);
                setPatient(updated);
                setEditing(false);
                toast.success("Patient updated successfully");
            }
        } catch (err) {
            const message = handleApiError(err).message;
            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this patient?")) {
            return;
        }

        try {
            setDeleting(true);
            setError(null);
            await deletePatient(patientId);
            toast.success("Patient deleted successfully");
            router.push("/dashboard/patients");
        } catch (err) {
            const message = handleApiError(err).message;
            setError(message);
            toast.error(message);
        } finally {
            setDeleting(false);
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Calculate age
    const calculateAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
            age--;
        }
        return age;
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            </div>
        );
    }

    if (!patient && !isNew) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Patient not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Back Button */}
            <Button
                onClick={() => router.push("/dashboard/patients")}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Patients
            </Button>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {isNew ? "Add New Patient" : (patient?.full_name || patient?.name)}
                    </h1>
                    {!isNew && patient && (
                        <p className="text-muted-foreground mt-1">
                            Patient ID: {patient.patient_id || patient.id}
                        </p>
                    )}
                    {!isNew && patient && (
                        <p className="text-muted-foreground mt-1">
                            MRN: {patient.medical_record_number || "Not assigned"}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {(can("patient.update") || (isNew && can("patient.write"))) && (
                        <Button
                            onClick={() => (editing ? handleSave() : setEditing(true))}
                            disabled={submitting}
                            variant={editing ? "default" : "outline"}
                            size="sm"
                            className="gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Edit2 className="h-4 w-4" />
                            )}
                            {editing ? "Save" : "Edit"}
                        </Button>
                    )}
                    {editing && !isNew && (
                        <Button
                            onClick={() => setEditing(false)}
                            variant="outline"
                            size="sm"
                        >
                            Cancel
                        </Button>
                    )}
                    {!isNew && can("patient.delete") && (
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Patient Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Patient ID */}
                        {isNew && (
                            <div>
                                <Label>Patient ID</Label>
                                <Input
                                    value={formData.patient_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, patient_id: e.target.value })
                                    }
                                    placeholder="e.g., PAT-001"
                                    className="mt-2"
                                />
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <Label>Full Name</Label>
                            {editing ? (
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.full_name || patient?.name}
                                </div>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <Label>Date of Birth</Label>
                            {editing ? (
                                <Input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            date_of_birth: e.target.value,
                                        })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient && (
                                        <>
                                            {formatDate(patient.date_of_birth)} (Age:{" "}
                                            {calculateAge(patient.date_of_birth)})
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Gender */}
                        <div>
                            <Label>Gender</Label>
                            {editing ? (
                                <select
                                    value={formData.gender}
                                    onChange={(e) =>
                                        setFormData({ ...formData, gender: e.target.value })
                                    }
                                    className="mt-2 w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="">Select gender</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.gender ? (
                                        <>
                                            {patient.gender === "M"
                                                ? "Male"
                                                : patient.gender === "F"
                                                    ? "Female"
                                                    : "Other"}
                                        </>
                                    ) : (
                                        "—"
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Medical Record Number */}
                        <div>
                            <Label>Medical Record Number</Label>
                            {editing ? (
                                <Input
                                    value={formData.medical_record_number}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            medical_record_number: e.target.value,
                                        })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.medical_record_number || "—"}
                                </div>
                            )}
                        </div>

                        {/* Contact Info */}
                        <div>
                            <Label>Contact Info</Label>
                            {editing ? (
                                <Input
                                    value={formData.contact_info}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            contact_info: e.target.value,
                                        })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.contact_info || "—"}
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <Label>Email</Label>
                            {editing ? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.email || "—"}
                                </div>
                            )}
                        </div>

                        {/* Weight */}
                        <div>
                            <Label>Weight (kg)</Label>
                            {editing ? (
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.weight_kg}
                                    onChange={(e) =>
                                        setFormData({ ...formData, weight_kg: e.target.value })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.weight_kg ? `${patient.weight_kg} kg` : "—"}
                                </div>
                            )}
                        </div>

                        {/* Height */}
                        <div>
                            <Label>Height (cm)</Label>
                            {editing ? (
                                <Input
                                    type="number"
                                    step="1"
                                    value={formData.height_cm}
                                    onChange={(e) =>
                                        setFormData({ ...formData, height_cm: e.target.value })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient?.height_cm ? `${patient.height_cm} cm` : "—"}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metadata */}
            {!isNew && patient && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(patient.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Updated:</span>
                            <span>{formatDate(patient.updated_at)}</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
