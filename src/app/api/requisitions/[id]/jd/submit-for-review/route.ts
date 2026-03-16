import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const req = await prisma.requisition.findUnique({
    where: { id },
    include: { jobDescription: true },
  })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!req.jobDescription) return NextResponse.json({ error: "No JD exists" }, { status: 404 })

  const isOwner = req.createdById === session.user.id
  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (req.jobDescription.status !== "DRAFT") {
    return NextResponse.json({ error: "JD must be in DRAFT to submit for review" }, { status: 400 })
  }

  const updated = await prisma.jobDescription.update({
    where: { id: req.jobDescription.id },
    data: { status: "IN_REVIEW" },
  })

  // Notify HR users
  const hrUsers = await prisma.user.findMany({ where: { role: "HR" } })
  await prisma.notification.createMany({
    data: hrUsers.map(u => ({
      userId: u.id,
      type: "jd_submitted_for_review",
      title: `JD ready for review: ${req.title}`,
      body: "A job description has been submitted for HR review and approval.",
      actionUrl: `/dashboard/requisitions/${id}/jd`,
    })),
  })

  return NextResponse.json(updated)
}
