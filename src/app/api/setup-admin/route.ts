import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    const result = await fetchMutation(api.auth.createDefaultAdmin, {});

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Default admin account created successfully",
        username: "admin@icrisstudio.com",
        password: "admin"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || "Admin already exists"
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create admin" },
      { status: 500 }
    );
  }
}
