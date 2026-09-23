/**
 * RoleGate — Client-side in-page RBAC enforcement component.
 *
 * Wraps any section or action button and renders nothing (or a fallback)
 * if the current user's role is not in the `allow` list.
 *
 * Use this for fine-grained in-page control that middleware cannot express,
 * e.g. hiding the "Publish Gazette" button from DISTRICT_OFFICER on the
 * gazette page, or hiding the "Upload" button from CITIZEN on documents.
 *
 * Usage:
 *   <RoleGate allow={['STATE_AUTHORITY', 'CENTRAL_MINISTRY']}>
 *     <PublishButton />
 *   </RoleGate>
 *
 *   <RoleGate allow={['AUDITOR']} fallback={<p>Read-only view</p>}>
 *     <EditForm />
 *   </RoleGate>
 */

"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/user";

interface RoleGateProps {
  /** Roles that ARE allowed to see the children. */
  allow: UserRole[];
  /** Optional content to render when the user is denied. Defaults to null. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ allow, fallback = null, children }: RoleGateProps) {
  const { activeRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;
  if (!allow.includes(activeRole)) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * CitizenGate — Convenience gate that HIDES children from CITIZEN role.
 * Use this to wrap officer-only actions inside shared pages
 * (e.g. hide "Draft Gazette" button on the /gazette page for CITIZEN users).
 */
export function CitizenGate({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { activeRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;
  if (activeRole === "CITIZEN") return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * ReadOnlyGate — Marks a section as read-only for AUDITOR and CITIZEN.
 * Wraps children with a visual "read-only" indicator when the user
 * cannot perform write actions.
 */
const READ_ONLY_ROLES: UserRole[] = ["AUDITOR", "CITIZEN"];

export function ReadOnlyGate({
  children,
  readOnlyFallback,
}: {
  children: React.ReactNode;
  readOnlyFallback: React.ReactNode;
}) {
  const { activeRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  if (READ_ONLY_ROLES.includes(activeRole)) return <>{readOnlyFallback}</>;

  return <>{children}</>;
}
