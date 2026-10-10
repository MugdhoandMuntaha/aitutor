import { auth } from "./auth";
import { getDb, ensureDatabaseSchema } from "../db";
import { workspaceMembers, workspaces } from "../db/schema";
import { eq, and } from "drizzle-orm";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspaceContext {
  userId: string;
  userEmail: string;
  userName: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceMode: "developer" | "student" | "both";
  role: WorkspaceRole;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new Error("Unauthorized: Please sign in to continue.");
  }
  return user;
}

export async function requireWorkspace(
  explicitWorkspaceId?: string,
  requiredRoles: WorkspaceRole[] = ["owner", "admin", "member", "viewer"]
): Promise<WorkspaceContext> {
  const user = await requireAuth();
  await ensureDatabaseSchema();
  const db = getDb();

  const targetWorkspaceId = explicitWorkspaceId || user.defaultWorkspaceId;

  if (!targetWorkspaceId) {
    // Attempt to find any workspace user belongs to
    const [firstMembership] = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.role,
        slug: workspaces.slug,
        name: workspaces.name,
        mode: workspaces.mode,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1);

    if (!firstMembership) {
      throw new Error("No active workspace found for this user.");
    }

    return {
      userId: user.id,
      userEmail: user.email || "",
      userName: user.name || "User",
      workspaceId: firstMembership.workspaceId,
      workspaceSlug: firstMembership.slug,
      workspaceName: firstMembership.name,
      workspaceMode: firstMembership.mode,
      role: firstMembership.role as WorkspaceRole,
    };
  }

  // Verify membership and role in target workspace
  const [membership] = await db
    .select({
      role: workspaceMembers.role,
      slug: workspaces.slug,
      name: workspaces.name,
      mode: workspaces.mode,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.workspaceId, targetWorkspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership) {
    throw new Error("Forbidden: You do not have access to this workspace.");
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role as WorkspaceRole)) {
    throw new Error(
      `Forbidden: Your role (${membership.role}) does not have sufficient permissions.`
    );
  }

  return {
    userId: user.id,
    userEmail: user.email || "",
    userName: user.name || "User",
    workspaceId: targetWorkspaceId,
    workspaceSlug: membership.slug,
    workspaceName: membership.name,
    workspaceMode: membership.mode,
    role: membership.role as WorkspaceRole,
  };
}
