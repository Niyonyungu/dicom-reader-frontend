/**
 * Permission Utilities and Constants
 * Centralized definitions for roles, permissions, and route maps
 */

/**
 * User roles (exact strings from backend)
 */
export enum UserRole {
  ADMIN = "admin",
  SERVICE = "service",
  RADIOLOGIST = "radiologist",
  IMAGING_TECHNICIAN = "imaging_technician",
  RADIOGRAPHER = "radiographer",
}

/**
 * Permission catalog (dot notation)
 * Full list from backend permission system
 */
export enum Permissions {
  // Patient management
  PATIENT_READ = "patient.read",
  PATIENT_WRITE = "patient.write",
  PATIENT_DELETE = "patient.delete",

  // Study management
  STUDY_READ = "study.read",
  STUDY_WRITE = "study.write",
  STUDY_DELETE = "study.delete",

  // Instance (image) management
  INSTANCE_READ = "instance.read",
  INSTANCE_WRITE = "instance.write",
  INSTANCE_DELETE = "instance.delete",

  // Measurements
  MEASUREMENT_READ = "measurement.read",
  MEASUREMENT_WRITE = "measurement.write",
  MEASUREMENT_DELETE = "measurement.delete",

  // Reports
  REPORT_READ = "report.read",
  REPORT_WRITE = "report.write",
  REPORT_DELETE = "report.delete",

  // Audit logs
  AUDIT_LOG_READ = "audit_log.read",
  AUDIT_LOG_WRITE = "audit_log.write",

  // DICOM operations
  DICOM_READ = "dicom.read",
  DICOM_WRITE = "dicom.write",
  DICOM_UPLOAD = "dicom.upload",
  DICOM_DELETE = "dicom.delete",
}

/**
 * Route permission requirements
 * Maps application routes to required permissions or roles
 * If multiple permissions listed, user must have ALL of them
 * If multiple roles listed, user must have ONE of them
 */
export const ROUTE_PERMISSIONS: Record<
  string,
  {
    permissions?: string[];
    roles?: UserRole[];
    description?: string;
  }
> = {
  // Public routes (no auth required)
  "/": {
    description: "Home/Dashboard",
  },
  "/login": {
    description: "Login",
  },

  // Dashboard (authenticated users only)
  "/dashboard": {
    description: "Dashboard",
  },

  // Patient management
  "/dashboard/patients": {
    permissions: [Permissions.PATIENT_READ],
    description: "Patient list",
  },
  "/dashboard/patients/create": {
    permissions: [Permissions.PATIENT_WRITE],
    description: "Create patient",
  },
  "/dashboard/patients/[id]": {
    permissions: [Permissions.PATIENT_READ],
    description: "Patient detail",
  },
  "/dashboard/patients/[id]/edit": {
    permissions: [Permissions.PATIENT_WRITE],
    description: "Edit patient",
  },

  // Studies
  "/dashboard/viewer": {
    permissions: [Permissions.STUDY_READ],
    description: "Study viewer",
  },
  "/dashboard/worklist": {
    permissions: [Permissions.STUDY_READ],
    description: "Worklist",
  },

  // Upload
  "/dashboard/upload": {
    permissions: [Permissions.DICOM_UPLOAD],
    description: "DICOM upload",
  },

  // Reports
  "/dashboard/reports": {
    permissions: [Permissions.REPORT_READ],
    description: "Reports",
  },
  "/dashboard/reports/create": {
    permissions: [Permissions.REPORT_WRITE],
    description: "Create report",
  },

  // User management (admin or service only)
  "/dashboard/settings/users": {
    roles: [UserRole.ADMIN, UserRole.SERVICE],
    description: "User management",
  },
  "/dashboard/settings/users/create": {
    roles: [UserRole.ADMIN, UserRole.SERVICE],
    description: "Create user",
  },
  "/dashboard/settings/users/[id]": {
    roles: [UserRole.ADMIN, UserRole.SERVICE],
    description: "User detail",
  },
  "/dashboard/settings/users/[id]/edit": {
    roles: [UserRole.ADMIN, UserRole.SERVICE],
    description: "Edit user",
  },

  // Auth register UI (admin only)
  "/dashboard/settings/register": {
    roles: [UserRole.ADMIN],
    description: "Register new user (admin only)",
  },

  // Profile/settings (any authenticated user)
  "/dashboard/settings/profile": {
    description: "User profile",
  },

  // RBAC matrix (admin only)
  "/dashboard/settings/rbac-matrix": {
    roles: [UserRole.ADMIN],
    description: "RBAC matrix viewer",
  },

  // Audit logs (read permission)
  "/dashboard/settings/audit-logs": {
    permissions: [Permissions.AUDIT_LOG_READ],
    description: "Audit logs",
  },
};

/**
 * Navigation items definition
 * Defines what appears in the sidebar/nav based on permissions
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  /** Required permission - user must have this */
  permission?: string;
  /** Allowed roles - user must have one of these */
  roles?: UserRole[];
  /** Sub-items for nested navigation */
  children?: NavItem[];
  /** Hide item if requirement not met */
  hideIfNoAccess?: boolean;
}

/**
 * Main navigation structure
 * Filtered at runtime based on user permissions
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Clinical",
    href: "#",
    children: [
      {
        label: "Studies",
        href: "/dashboard/worklist",
        permission: Permissions.STUDY_READ,
        hideIfNoAccess: true,
      },
      {
        label: "Viewer",
        href: "/dashboard/viewer",
        permission: Permissions.STUDY_READ,
        hideIfNoAccess: true,
      },
      {
        label: "Upload",
        href: "/dashboard/upload",
        permission: Permissions.DICOM_UPLOAD,
        hideIfNoAccess: true,
      },
      {
        label: "Reports",
        href: "/dashboard/reports",
        permission: Permissions.REPORT_READ,
        hideIfNoAccess: true,
      },
    ],
  },
  {
    label: "Patients",
    href: "/dashboard/patients",
    permission: Permissions.PATIENT_READ,
    hideIfNoAccess: true,
  },
  {
    label: "Settings",
    href: "#",
    children: [
      {
        label: "Profile",
        href: "/dashboard/settings/profile",
      },
      {
        label: "Users",
        href: "/dashboard/settings/users",
        roles: [UserRole.ADMIN, UserRole.SERVICE],
        hideIfNoAccess: true,
      },
      {
        label: "Audit Logs",
        href: "/dashboard/settings/audit-logs",
        permission: Permissions.AUDIT_LOG_READ,
        hideIfNoAccess: true,
      },
      {
        label: "RBAC Matrix",
        href: "/dashboard/settings/rbac-matrix",
        roles: [UserRole.ADMIN],
        hideIfNoAccess: true,
      },
    ],
  },
];

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return !["login", "register", "/"].some((pub) => path.includes(pub));
}

/**
 * Get required permissions for a route
 */
export function getRouteRequirements(
  path: string
): { permissions?: string[]; roles?: UserRole[] } | null {
  // Exact match
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path];
  }

  // Pattern match for dynamic routes
  const patterns = Object.keys(ROUTE_PERMISSIONS);
  for (const pattern of patterns) {
    // Convert [id] to regex
    const regex = new RegExp(`^${pattern.replace(/\[.*?\]/g, "[^/]+")}$`);
    if (regex.test(path)) {
      return ROUTE_PERMISSIONS[pattern];
    }
  }

  return null;
}
