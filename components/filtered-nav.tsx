/**
 * Permission-Filtered Navigation
 * Automatically shows/hides nav items based on user permissions
 *
 * Usage:
 * ```tsx
 * import { FilteredNav } from '@/components/filtered-nav';
 *
 * <FilteredNav items={NAV_ITEMS} />
 * ```
 */

"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { NavItem, UserRole } from "@/lib/permissions";
import { useState } from "react";

export interface FilteredNavProps {
    items: NavItem[];
    /** CSS class for the nav container */
    className?: string;
    /** CSS class for nav items */
    itemClassName?: string;
    /** CSS class for sub-menu items */
    subItemClassName?: string;
    /** Callback when nav item is clicked */
    onItemClick?: (href: string) => void;
}

/**
 * Check if nav item should be visible
 */
function shouldShowItem(item: NavItem, permissions: Record<string, boolean>): boolean {
    // No access requirement - always show
    if (!item.hideIfNoAccess && !item.permission && !item.roles) {
        return true;
    }

    // Check permission
    if (item.permission) {
        return permissions[item.permission] ?? false;
    }

    // Check roles
    if (item.roles) {
        return item.roles.some((role) => permissions[`role:${role}`]);
    }

    // Default to showing
    return true;
}

/**
 * Filter navigation items based on user permissions
 * Hides items the user doesn't have access to
 */
export function FilteredNav({
    items,
    className = "space-y-1",
    itemClassName = "px-4 py-2 text-sm rounded-md hover:bg-accent",
    subItemClassName = "ml-4 px-4 py-2 text-sm rounded-md hover:bg-accent",
    onItemClick,
}: FilteredNavProps) {
    const { can, hasRole } = usePermissions();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Build permission map for filtering
    const permissionMap: Record<string, boolean> = {};

    // Add all permission checks
    items.forEach((item) => {
        if (item.permission) {
            permissionMap[item.permission] = can(item.permission);
        }
        if (item.roles) {
            item.roles.forEach((role) => {
                permissionMap[`role:${role}`] = hasRole(role);
            });
        }
        if (item.children) {
            item.children.forEach((child) => {
                if (child.permission) {
                    permissionMap[child.permission] = can(child.permission);
                }
                if (child.roles) {
                    child.roles.forEach((role) => {
                        permissionMap[`role:${role}`] = hasRole(role);
                    });
                }
            });
        }
    });

    /**
     * Toggle submenu visibility
     */
    const toggleExpanded = (href: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(href)) {
            newExpanded.delete(href);
        } else {
            newExpanded.add(href);
        }
        setExpandedItems(newExpanded);
    };

    /**
     * Recursively render nav items and filter by permission
     */
    function renderItems(
        navItems: NavItem[],
        isSubMenu: boolean = false
    ): React.ReactNode {
        return navItems
            .filter((item) => shouldShowItem(item, permissionMap))
            .map((item) => (
                <div key={item.href}>
                    {item.children ? (
                        <button
                            onClick={() => toggleExpanded(item.href)}
                            className={isSubMenu ? subItemClassName : itemClassName}
                        >
                            <div className="flex items-center justify-between cursor-pointer">
                                <span>{item.label}</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${expandedItems.has(item.href) ? "rotate-180" : ""
                                        }`}
                                />
                            </div>
                        </button>
                    ) : (
                        <Link
                            href={item.href}
                            className={isSubMenu ? subItemClassName : itemClassName}
                            onClick={() => onItemClick?.(item.href)}
                        >
                            {item.label}
                        </Link>
                    )}

                    {/* Submenu items */}
                    {item.children && expandedItems.has(item.href) && (
                        <div className="pl-2">
                            {renderItems(item.children, true)}
                        </div>
                    )}
                </div>
            ));
    }

    return <nav className={className}>{renderItems(items)}</nav>;
}
