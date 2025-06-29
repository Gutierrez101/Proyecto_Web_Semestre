import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const where = role === "teacher" ? { ownerId: "current" } : {};
  const classes = await db.studyClass.findMany({ where, include: { owner: true } });

  return NextResponse.json(classes);
}