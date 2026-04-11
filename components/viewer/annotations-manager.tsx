/**
 * Annotations Manager Component
 * UI for managing annotations (CRUD operations)
 * Can be used in viewer or standalone
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Copy, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface Annotation {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    createdAt: string;
}

export interface AnnotationsManagerProps {
    annotations: Annotation[];
    onAdd?: (annotation: Annotation) => Promise<void>;
    onUpdate?: (id: string, annotation: Partial<Annotation>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    readonly?: boolean;
}

const ANNOTATION_COLORS = [
    { value: "#FFFF00", label: "Yellow", bg: "bg-yellow-400" },
    { value: "#FF0000", label: "Red", bg: "bg-red-500" },
    { value: "#0000FF", label: "Blue", bg: "bg-blue-500" },
    { value: "#00FF00", label: "Green", bg: "bg-green-500" },
    { value: "#8B00FF", label: "Purple", bg: "bg-purple-600" },
    { value: "#FFFFFF", label: "White", bg: "bg-white border-2 border-gray-300" },
];

export function AnnotationsManager({
    annotations,
    onAdd,
    onUpdate,
    onDelete,
    readonly = false,
}: AnnotationsManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        text: "",
        x: "",
        y: "",
        color: "#FFFF00",
    });

    // Reset form
    const resetForm = () => {
        setFormData({ text: "", x: "", y: "", color: "#FFFF00" });
        setEditingId(null);
    };

    // Open edit dialog
    const handleEdit = (annotation: Annotation) => {
        if (readonly) return;
        setFormData({
            text: annotation.text,
            x: annotation.x.toString(),
            y: annotation.y.toString(),
            color: annotation.color,
        });
        setEditingId(annotation.id);
        setIsOpen(true);
    };

    // Submit
    const handleSubmit = async () => {
        if (!formData.text || !formData.x || !formData.y) {
            setError("Please fill in all fields");
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            if (editingId && onUpdate) {
                await onUpdate(editingId, {
                    text: formData.text,
                    x: Number(formData.x),
                    y: Number(formData.y),
                    color: formData.color,
                });
                toast.success("Annotation updated successfully");
            } else if (onAdd) {
                const newAnnotation: Annotation = {
                    id: `A${Date.now()}`,
                    text: formData.text,
                    x: Number(formData.x),
                    y: Number(formData.y),
                    color: formData.color,
                    createdAt: new Date().toISOString(),
                };
                await onAdd(newAnnotation);
                toast.success("Annotation added successfully");
            }

            resetForm();
            setIsOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save annotation";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Delete
    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this annotation?")) return;

        try {
            setLoading(true);
            setError(null);
            if (onDelete) await onDelete(id);
            toast.success("Annotation deleted successfully");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete annotation";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const handleCopy = (annotation: Annotation) => {
        navigator.clipboard.writeText(annotation.text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Annotations ({annotations.length})</h3>
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

            {/* Annotations Table */}
            {annotations.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Color</TableHead>
                                <TableHead>Text</TableHead>
                                <TableHead>Position (X, Y)</TableHead>
                                {!readonly && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {annotations.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell>
                                        <div
                                            className="w-6 h-6 rounded border"
                                            style={{ backgroundColor: a.color }}
                                            title={a.color}
                                        />
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{a.text}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground font-mono">
                                        ({a.x}, {a.y})
                                    </TableCell>
                                    {!readonly && (
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    onClick={() => handleCopy(a)}
                                                    size="sm"
                                                    variant="ghost"
                                                    title="Copy"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleEdit(a)}
                                                    size="sm"
                                                    variant="ghost"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(a.id)}
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
                    <p className="text-muted-foreground">No annotations yet</p>
                </Card>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Edit" : "Add"} Annotation
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Text */}
                        <div className="space-y-2">
                            <Label>Text</Label>
                            <Input
                                placeholder="Annotation text"
                                value={formData.text}
                                onChange={(e) =>
                                    setFormData({ ...formData, text: e.target.value })
                                }
                            />
                        </div>

                        {/* Position */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>X Position</Label>
                                <Input
                                    type="number"
                                    placeholder="Pixels"
                                    value={formData.x}
                                    onChange={(e) =>
                                        setFormData({ ...formData, x: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Y Position</Label>
                                <Input
                                    type="number"
                                    placeholder="Pixels"
                                    value={formData.y}
                                    onChange={(e) =>
                                        setFormData({ ...formData, y: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {ANNOTATION_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() =>
                                            setFormData({ ...formData, color: color.value })
                                        }
                                        className={`w-8 h-8 rounded border-2 transition ${formData.color === color.value
                                            ? "border-foreground ring-2 ring-primary"
                                            : "border-gray-300"
                                            } ${color.bg}`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
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
