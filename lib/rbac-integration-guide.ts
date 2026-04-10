/**
 * RBAC Integration Guide & Examples
 * Complete examples showing how to implement permission-gated UI throughout the app
 *
 * This file demonstrates all RBAC patterns from Prompt 3
 */

/**
 * EXAMPLE 1: Using usePermissions hook in components
 *
 * ```tsx
 * import { usePermissions } from '@/hooks/use-permissions';
 *
 * export function ReportsList() {
 *   const { canCreate, canDelete, can } = usePermissions();
 *
 *   return (
 *     <div>
 *       {canCreate('report') && (
 *         <button>Create New Report</button>
 *       )}
 *
 *       <table>
 *         {reports.map(report => (
 *           <tr key={report.id}>
 *             <td>{report.title}</td>
 *             <td>
 *               {can('report.write') && <button>Edit</button>}
 *               {canDelete('report') && <button>Delete</button>}
 *             </td>
 *           </tr>
 *         ))}
 *       </table>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 2: Protecting routes with PermissionRouteGuard in page.tsx
 *
 * ```tsx
 * import { PermissionRouteGuard } from '@/components/permission-route-guard';
 * import { usePathname } from 'next/navigation';
 *
 * export default function StudiesPage() {
 *   const pathname = usePathname();
 *
 *   return (
 *     <PermissionRouteGuard path={pathname}>
 *       <StudiesList />
 *     </PermissionRouteGuard>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 3: Using FilteredNav for permission-gated navigation
 *
 * ```tsx
 * import { FilteredNav } from '@/components/filtered-nav';
 * import { NAV_ITEMS } from '@/lib/permissions';
 *
 * export function Sidebar() {
 *   return (
 *     <aside>
 *       <FilteredNav items={NAV_ITEMS} />
 *     </aside>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 4: Handling 403 API errors with clear messaging
 *
 * ```tsx
 * import { handleApiError } from '@/lib/api-error-handler';
 * import { apiClient } from '@/lib/api-client';
 * import { toast } from '@/components/ui/use-toast';
 *
 * export function EditReportForm() {
 *   const handleSubmit = async (data) => {
 *     try {
 *       const result = await apiClient.request('PUT', `/reports/${id}`, {
 *         body: data,
 *       });
 *       toast.success('Report updated');
 *     } catch (error) {
 *       const handled = handleApiError(error, {
 *         context: 'Failed to save report',
 *       });
 *
 *       if (handled.isForbidden) {
 *         toast.error(`No permission: ${handled.message}`);
 *       } else {
 *         toast.error(handled.message);
 *       }
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */

/**
 * EXAMPLE 5: Role-specific UI using usePermissions
 *
 * ```tsx
 * import { usePermissions } from '@/hooks/use-permissions';
 * import { UserRole } from '@/lib/permissions';
 *
 * export function SettingsMenu() {
 *   const { hasRole } = usePermissions();
 *   const isAdmin = hasRole(UserRole.ADMIN);
 *
 *   return (
 *     <menu>
 *       <a href="/dashboard/settings/profile">Profile</a>
 *       {isAdmin && <a href="/dashboard/settings/users">Manage Users</a>}
 *       {isAdmin && <a href="/dashboard/settings/rbac-matrix">RBAC Matrix</a>}
 *     </menu>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 6: Multi-permission requirements
 *
 * ```tsx
 * import { usePermissions } from '@/hooks/use-permissions';
 *
 * export function StudyActions({ study }) {
 *   const { can, canAny } = usePermissions();
 *
 *   // Require both study.write AND dicom.write
 *   const canUpdateStudy = can('study.write') && can('dicom.write');
 *
 *   // Allow if user has ANY of these permissions
 *   const canViewReport = canAny(['report.read', 'report.write']);
 *
 *   return (
 *     <>
 *       {canUpdateStudy && <button>Update Study</button>}
 *       {canViewReport && <button>View Report</button>}
 *     </>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 7: Form field visibility based on permissions
 *
 * ```tsx
 * import { usePermissions } from '@/hooks/use-permissions';
 *
 * export function UserForm({ user }) {
 *   const { hasRole } = usePermissions();
 *   const isPrivileged = hasRole(UserRole.ADMIN) || hasRole(UserRole.SERVICE);
 *
 *   return (
 *     <form>
 *       <input name="email" value={user.email} />
 *       <input name="full_name" value={user.full_name} />
 *
 *       {isPrivileged && (
 *         <>
 *           <select name="role">
 *             <option>radiologist</option>
 *             <option>imaging_technician</option>
 *           </select>
 *           <input name="is_active" type="checkbox" />
 *         </>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 8: Permission-based button disabling
 *
 * ```tsx
 * import { usePermissions } from '@/hooks/use-permissions';
 *
 * export function PatientCard({ patient }) {
 *   const { can } = usePermissions();
 *   const canDelete = can('patient.delete');
 *
 *   return (
 *     <div>
 *       <h3>{patient.name}</h3>
 *       <button
 *         onClick={handleDelete}
 *         disabled={!canDelete}
 *         title={canDelete ? '' : 'You do not have permission to delete'}
 *       >
 *         Delete
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * EXAMPLE 9: Custom error boundary for 403 errors
 *
 * ```tsx
 * import { ReactNode } from 'react';
 * import { ForbiddenPage } from '@/components/forbidden-page';
 * import { handleApiError } from '@/lib/api-error-handler';
 *
 * interface Props {
 *   children: ReactNode;
 *   fallback?: ReactNode;
 * }
 *
 * export function PermissionErrorBoundary({ children, fallback }: Props) {
 *   try {
 *     return children;
 *   } catch (error) {
 *     const handled = handleApiError(error);
 *     if (handled.isForbidden) {
 *       return fallback || <ForbiddenPage message={handled.message} />;
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */

/**
 * EXAMPLE 10: Checking permissions in useEffect dependencies
 *
 * ```tsx
 * import { useEffect } from 'react';
 * import { usePermissions } from '@/hooks/use-permissions';
 *
 * export function AdminDashboard() {
 *   const { hasRole } = usePermissions();
 *
 *   useEffect(() => {
 *     // Only fetch admin-specific data if user is admin
 *     if (hasRole(UserRole.ADMIN)) {
 *       fetchAdminMetrics();
 *     }
 *   }, [hasRole(UserRole.ADMIN)]);
 *
 *   return <div>Dashboard content</div>;
 * }
 * ```
 */

/**
 * INTEGRATION CHECKLIST
 *
 * ✓ 1. Wrap main layout with AuthProvider (already done in Prompt 2)
 * ✓ 2. Initialize API interceptor (already done in Prompt 2)
 * ✓ 3. Define route requirements in ROUTE_PERMISSIONS
 * ✓ 4. Define nav structure in NAV_ITEMS
 *
 * ✓ 5. In page.tsx files:
 *     - Import PermissionRouteGuard
 *     - Wrap content with guard
 *     - Pass current pathname
 *
 * ✓ 6. In sidebar/nav component:
 *     - Import FilteredNav
 *     - Pass NAV_ITEMS
 *     - Nav items auto-filtered by permissions
 *
 * ✓ 7. In feature components:
 *     - Import usePermissions
 *     - Call can(), canAny(), hasRole() to:
 *       - Show/hide buttons
 *       - Enable/disable controls
 *       - Show/hide form fields
 *
 * ✓ 8. In API handlers:
 *     - Import handleApiError
 *     - Catch errors
 *     - Check isForbidden
 *     - Show user-friendly message
 *
 * ✓ 9. Test permission scenarios:
 *     - Admin user (all permissions)
 *     - Radiologist (study.*, measurement.*)
 *     - Radiographer (limited read + dicom.upload)
 *     - Try accessing forbidden pages (should see 403)
 *     - Try calling forbidden API endpoints (should show permission error)
 *
 * ✓ 10. Optional: Create admin RBAC matrix viewer (Prompt 7)
 */

// This file is for documentation only - no exports
export {};
