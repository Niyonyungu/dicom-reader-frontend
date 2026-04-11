'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstanceDicomViewer } from '@/components/viewer/instance-dicom-viewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function InstanceViewerPage() {
    const params = useParams();
    const router = useRouter();
    const instanceId = params.id ? parseInt(params.id as string) : null;

    if (!instanceId) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">Invalid instance ID</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Instance Viewer</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                <InstanceDicomViewer instanceId={instanceId} />
            </div>
        </div>
    );
}
