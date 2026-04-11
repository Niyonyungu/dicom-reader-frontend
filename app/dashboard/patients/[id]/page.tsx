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

    // State
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
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
            try {
                setLoading(true);
                setError(null);
                const data = await getPatient(patientId);
                setPatient(data);
                setFormData({
                    name: data.name,
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
    }, [patientId]);

    // Handle update
    const handleUpdate = async () => {
        try {
            setSubmitting(true);
            setError(null);

            await updatePatient(patientId, {
                name: formData.name,
                date_of_birth: formData.date_of_birth,
                gender: (formData.gender as "M" | "F" | "O") || undefined,
                contact_info: formData.contact_info || undefined,
                email: formData.email || undefined,
                weight_kg: formData.weight_kg ? Number(formData.weight_kg) : undefined,
                height_cm: formData.height_cm ? Number(formData.height_cm) : undefined,
                medical_record_number: formData.medical_record_number || undefined,
            });

            // Refresh patient
            const updated = await getPatient(patientId);
            setPatient(updated);
            setEditing(false);
            toast.success("Patient updated successfully");
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

    if (!patient) {
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
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
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
                    <h1 className="text-3xl font-bold">{patient.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        MRN: {patient.medical_record_number || "Not assigned"}
                    </p>
                </div>
                <div className="flex gap-2">
                    {can("patient.update") && (
                        <Button
                            onClick={() => (editing ? handleUpdate() : setEditing(true))}
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
                    {editing && (
                        <Button
                            onClick={() => setEditing(false)}
                            variant="outline"
                            size="sm"
                        >
                            Cancel
                        </Button>
                    )}
                    {can("patient.delete") && (
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
                        {/* Name */}
                        <div>
                            <Label>Full Name</Label>
                            {editing ? (
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="mt-2"
                                />
                            ) : (
                                <div className="mt-2 p-3 bg-muted rounded">
                                    {patient.name}
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
                                    {formatDate(patient.date_of_birth)} (Age:{" "}
                                    {calculateAge(patient.date_of_birth)})
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
                                    {patient.gender ? (
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
                                    {patient.medical_record_number || "—"}
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
                                    {patient.contact_info || "—"}
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
                                    {patient.email || "—"}
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
                                    {patient.weight_kg ? `${patient.weight_kg} kg` : "—"}
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
                                    {patient.height_cm ? `${patient.height_cm} cm` : "—"}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metadata */}
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
        </div>
    );
}
