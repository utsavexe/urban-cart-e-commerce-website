import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createAddressSchema } from "@/lib/validations/address";

// GET /api/addresses — Get user's addresses
export async function GET() {
  try {
    const user = await requireAuth();

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(addresses);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADDRESSES_GET_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST /api/addresses — Create address
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const addressCount = await db.address.count({
      where: { userId: user.id },
    });

    const address = await db.address.create({
      data: {
        ...data,
        userId: user.id,
        isDefault: data.isDefault || addressCount === 0,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADDRESSES_POST_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
