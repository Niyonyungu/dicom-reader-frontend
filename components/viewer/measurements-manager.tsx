/**
 * Measurements Manager Component
 * UI for managing measurements (CRUD operations)
 * Can be used in viewer or standalone
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Copy, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface Measurement {
    id: string;
    type: "distance" | "angle" | "area" | "roi" | "hu" | "volume";
    label: string;
    value: number;
    unit: string;
    coordinates: Array<{ x: number; y: number }>;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface MeasurementsManagerProps {
    measurements: Measurement[];
    onAdd?: (measurement: Measurement) => Promise<void>;
    onUpdate?: (id: string, measurement: Partial<Measurement>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    readonly?: boolean;
}

const MEASUREMENT_TYPES = [
    { value: "distance", label: "Distance (mm)" },
    { value: "angle", label: "Angle (°)" },
    { value: "area", label: "Area (mm²)" },
    { value: "roi", label: "ROI Statistics" },
    { value: "hu", label: "Hounsfield Unit" },
    { value: "volume", label: "Volume (mm³)" },
];

export function MeasurementsManager({
    measurements,
    onAdd,
    onUpdate,
    onDelete,
    readonly = false,
}: MeasurementsManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: "distance",
        label: "",
        value: "",
    });

    // Reset form
    const resetForm = () => {
        setFormData({ type: "distance", label: "", value: "" });
        setEditingId(null);
    };

    // Open edit dialog
    const handleEdit = (measurement: Measurement) => {
        if (readonly) return;
        setFormData({
            type: measurement.type,
            label: measurement.label,
            value: measurement.value.toString(),
        });
        setEditingId(measurement.id);
        setIsOpen(true);
    };

    // Submit
    const handleSubmit = async () => {
        if (!formData.label || !formData.value) {
            setError("Please fill in all fields");
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const typeInfo = MEASUREMENT_TYPES.find((t) => t.value === formData.type);
            const unit = typeInfo?.label.match(/\((.*?)\)/)?.[1] || "";

            if (editingId && onUpdate) {
                await onUpdate(editingId, {
                    type: (formData.type as any),
                    label: formData.label,
                    value: Number(formData.value),
                    unit,
                });
                toast.success("Measurement updated successfully");
            } else if (onAdd) {
                const newMeasurement: Measurement = {
                    id: `M${Date.now()}`,
                    type: (formData.type as any),
                    label: formData.label,
                    value: Number(formData.value),
                    unit,
                    coordinates: [],
                    createdAt: new Date().toISOString(),
                };
                await onAdd(newMeasurement);
                toast.success("Measurement added successfully");
            }

            resetForm();
            setIsOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save measurement";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Delete
    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this measurement?")) return;

        try {
            setLoading(true);
            setError(null);
            if (onDelete) await onDelete(id);
            toast.success("Measurement deleted successfully");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete measurement";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const handleCopy = (measurement: Measurement) => {
        const text = `${measurement.label}: ${measurement.value} ${measurement.unit}`;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Measurements ({measurements.length})</h3>
                {!readonly && (
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsOpen(true);
                        }}
                        size="sm"
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <Alert variant="destructive" className="text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Measurements Table */}
            {measurements.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Label</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Unit</TableHead>
                                {!readonly && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {measurements.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.label}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{m.type}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono">{m.value.toFixed(2)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {m.unit}
                                    </TableCell>
                                    {!readonly && (
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    onClick={() => handleCopy(m)}
                                                    size="sm"
                                                    variant="ghost"
                                                    title="Copy"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleEdit(m)}
                                                    size="sm"
                                                    variant="ghost"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(m.id)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <Card className="text-center py-8">
                    <p className="text-muted-foreground">No measurements yet</p>
                </Card>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Edit" : "Add"} Measurement
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Measurement Type</Label>
                            <Select value={formData.type} onValueChange={(value) =>
                                setFormData({ ...formData, type: value })
                            }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MEASUREMENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Label */}
                        <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                                placeholder="e.g., Lesion Width"
                                value={formData.label}
                                onChange={(e) =>
                                    setFormData({ ...formData, label: e.target.value })
                                }
                            />
                        </div>

                        {/* Value */}
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.value}
                                onChange={(e) =>
                                    setFormData({ ...formData, value: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editingId ? "Update" : "Add"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
