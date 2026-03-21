'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMobileContext } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    Maximize,
    Minimize,
} from 'lucide-react';

interface MobileViewerWrapperProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    showSidebar?: boolean;
    onSidebarToggle?: () => void;
}

/**
 * Mobile-optimized wrapper for DICOM viewer
 * Provides responsive layout, touch optimizations, and adaptive UI
 */
export function MobileViewerWrapper({
    children,
    title,
    subtitle,
    showSidebar = true,
    onSidebarToggle,
}: MobileViewerWrapperProps) {
    const isMobile = useMobileContext();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle fullscreen toggle
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!isFullscreen && containerRef.current) {
                await containerRef.current.requestFullscreen().catch(err => {
                    console.warn('Fullscreen request failed:', err);
                });
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen toggle failed:', error);
        }
    };

    if (isMobile) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-full flex flex-col bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'
                    }`}
            >
                {/* Mobile Header */}
                <div
                    className="bg-slate-900 border-b border-border px-3 py-2 flex items-center justify-between"
                    style={{
                        paddingTop: `max(env(safe-area-inset-top, 0), 8px)`,
                    }}
                >
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h2 className="text-sm font-semibold text-foreground truncate">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-1 ml-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="h-8 w-8 p-0"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-4 w-4" />
                            ) : (
                                <Maximize className="h-4 w-4" />
                            )}
                        </Button>
                        {showSidebar && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSidebarToggle}
                                className="h-8 w-8 p-0"
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Viewer Area */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto">
                        {children}
                    </div>
                </div>

                {/* Mobile Controls Toggle */}
                <div className="absolute bottom-4 right-4 z-40">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setControlsVisible(!controlsVisible)}
                        className="rounded-full"
                    >
                        {controlsVisible ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Safe area padding for notches */}
                <div
                    style={{
                        paddingBottom: `max(env(safe-area-inset-bottom, 0), 8px)`,
                    }}
                />
            </div>
        );
    }

    // Desktop layout
    return (
        <div className="w-full h-full flex flex-col bg-black space-y-4 p-4">
            {title && (
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
}

/**
 * Mobile-optimized controls panel with collapsible sections
 */
export function MobileControlsPanel({
    title,
    children,
    isOpen = true,
}: {
    title: string;
    children: React.ReactNode;
    isOpen?: boolean;
}) {
    const [expanded, setExpanded] = useState(isOpen);
    const isMobile = useMobileContext();

    if (!isMobile) {
        return (
            <Card className="border-border p-4">
                <h3 className="font-semibold mb-3">{title}</h3>
                {children}
            </Card>
        );
    }

    return (
        <Card className="border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/75 transition-colors"
            >
                <span className="font-semibold text-sm">{title}</span>
                {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>

            {expanded && <div className="p-3 border-t border-border">{children}</div>}
        </Card>
    );
}

/**
 * Touch-optimized button with larger hit area for mobile
 */
export function TouchButton({
    onClick,
    children,
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const isMobile = useMobileContext();

    return (
        <button
            onClick={onClick}
            className={`
        transition-colors
        ${isMobile ? 'min-h-[44px] min-w-[44px]' : 'h-auto'}
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Responsive grid for measurements and stats
 */
export function ResponsiveStatsGrid({
    children,
}: {
    children: React.ReactNode;
}) {
    const isMobile = useMobileContext();

    return (
        <div
            className={
                isMobile
                    ? 'grid grid-cols-1 gap-2'
                    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
            }
        >
            {children}
        </div>
    );
}

/**
 * Stat card component for responsive display
 */
export function StatCard({
    label,
    value,
    unit,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    unit?: string;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    const isMobile = useMobileContext();

    return (
        <Card className="border-border p-3 text-center">
            {Icon && <Icon className="h-4 w-4 mx-auto mb-1 opacity-60" />}
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {label}
            </p>
            <p className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                {typeof value === 'number' ? value.toFixed(1) : value}
                {unit && <span className="text-xs ml-1">{unit}</span>}
            </p>
        </Card>
    );
}
