import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, sellerCategories, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { randomUUID } from "crypto";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// PUT — update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, companyName, city, state, description, isVerified, isActive, role, categoryIds, adminId } = body;

  // Get current user data for audit diff
  const [currentUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Build changes object for audit
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (name !== undefined && name !== currentUser.name) changes.name = { from: currentUser.name, to: name };
  if (companyName !== undefined && companyName !== currentUser.companyName) changes.companyName = { from: currentUser.companyName, to: companyName };
  if (city !== undefined && city !== currentUser.city) changes.city = { from: currentUser.city, to: city };
  if (state !== undefined && state !== currentUser.state) changes.state = { from: currentUser.state, to: state };
  if (description !== undefined && description !== currentUser.description) changes.description = { from: currentUser.description, to: description };
  if (typeof isVerified === "boolean" && isVerified !== currentUser.isVerified) changes.isVerified = { from: currentUser.isVerified, to: isVerified };
  if (typeof isActive === "boolean" && isActive !== currentUser.isActive) changes.isActive = { from: currentUser.isActive, to: isActive };
  if (role !== undefined && role !== currentUser.role) changes.role = { from: currentUser.role, to: role };

  // Update user
  await db
    .update(users)
    .set({
      ...(name !== undefined && { name }),
      ...(companyName !== undefined && { companyName }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(description !== undefined && { description }),
      ...(typeof isVerified === "boolean" && { isVerified }),
      ...(typeof isActive === "boolean" && { isActive }),
      ...(role !== undefined && { role }),
    })
    .where(eq(users.id, id));

  // Update seller categories if provided
  if (Array.isArray(categoryIds)) {
    // Remove all existing
    await db.delete(sellerCategories).where(eq(sellerCategories.userId, id));
    // Insert new ones
    if (categoryIds.length > 0) {
      await db.insert(sellerCategories).values(
        categoryIds.map((catId: string) => ({
          id: randomUUID(),
          userId: id,
          categoryId: catId,
        }))
      );
    }
    changes.sellerCategories = { from: "previous set", to: categoryIds.length + " categories" };
  }

  // Log audit
  await logAudit({
    adminId: adminId || admin.id,
    action: Object.keys(changes).some((k) => k === "isActive") && !isActive ? "user.deactivate" : "user.update",
    targetType: "user",
    targetId: id,
    targetName: companyName || name || currentUser.email,
    changes,
  });

  return NextResponse.json({ ok: true });
}
