"use server";

import * as argon2 from "argon2";
import { getDb, ensureDatabaseSchema } from "@/core/db";
import { users, workspaces, workspaceMembers } from "@/core/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mode: z.enum(["developer", "student", "both"]).default("both"),
});

export async function registerUser(formData: FormData | { name: string; email: string; password: string; mode?: "developer" | "student" | "both" }) {
  await ensureDatabaseSchema();
  const db = getDb();

  const rawData =
    formData instanceof FormData
      ? {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          mode: (formData.get("mode") as any) || "both",
        }
      : formData;

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input data" };
  }

  const { name, email, password, mode } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if existing user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await argon2.hash(password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email: normalizedEmail,
      passwordHash,
    })
    .returning();

  // Create default workspace
  const workspaceSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-hub-${Math.random().toString(36).substring(2, 6)}`;
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: `${name}'s Workspace`,
      slug: workspaceSlug,
      mode,
      createdBy: newUser.id,
    })
    .returning();

  // Associate as owner
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: newUser.id,
    role: "owner",
  });

  // Update default workspace
  await db
    .update(users)
    .set({ defaultWorkspaceId: workspace.id })
    .where(eq(users.id, newUser.id));

  return { success: true, email: normalizedEmail };
}
