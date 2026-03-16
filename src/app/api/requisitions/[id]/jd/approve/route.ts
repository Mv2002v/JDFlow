import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const req = await prisma.requisition.findUnique({
    where: { id },
    include: { jobDescription: true },
  })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!req.jobDescription) return NextResponse.json({ error: "No JD exists" }, { status: 404 })

  if (req.jobDescription.status !== "IN_REVIEW") {
    return NextResponse.json({ error: "JD must be IN_REVIEW to approve" }, { status: 400 })
  }

  const updated = await prisma.jobDescription.update({
    where: { id: req.jobDescription.id },
    data: { status: "APPROVED" },
  })

  await prisma.requisition.update({
    where: { id },
    data: { status: "READY_TO_POST" },
  })

  await prisma.notification.create({
    data: {
      userId: req.createdById,
      type: "jd_approved",
      title: `JD approved: ${req.title}`,
      body: "Your job description has been approved by HR and is ready to post.",
      actionUrl: `/dashboard/requisitions/${id}/jd`,
    },
  })

  return NextResponse.json(updated)
}
