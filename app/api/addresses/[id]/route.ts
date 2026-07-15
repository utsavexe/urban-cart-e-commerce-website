import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { updateAddressSchema } from "@/lib/validations/address";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/addresses/[id] — Update address
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await db.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const address = await db.address.update({
      where: { id },
      data,
    });

    return NextResponse.json(address);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADDRESS_PATCH_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] — Delete address
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await db.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    await db.address.delete({ where: { id } });

    // If we deleted the default, make another one default
    if (existing.isDefault) {
      const nextAddress = await db.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      if (nextAddress) {
        await db.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ message: "Address deleted" });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADDRESS_DELETE_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
