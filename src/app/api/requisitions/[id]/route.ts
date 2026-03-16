import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const req = await prisma.requisition.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      workflows: {
        where: { isLatest: true },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
        take: 1,
      },
      jobDescription: true,
    },
  })

  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  if (!isAdmin && req.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(req)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const existing = await prisma.requisition.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  const isOwner = existing.createdById === session.user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const deletable = ["DRAFT", "CANCELLED"]
  if (!deletable.includes(existing.status)) {
    return NextResponse.json(
      { error: "Only DRAFT or CANCELLED requisitions can be deleted" },
      { status: 400 }
    )
  }

  // Delete in dependency order
  await prisma.notification.deleteMany({ where: { actionUrl: { contains: id } } })
  await prisma.jdComment.deleteMany({
    where: { jobDescription: { requisitionId: id } },
  })
  await prisma.jdVersion.deleteMany({
    where: { jobDescription: { requisitionId: id } },
  })
  await prisma.jobDescription.deleteMany({ where: { requisitionId: id } })
  await prisma.approvalStep.deleteMany({
    where: { workflow: { requisitionId: id } },
  })
  await prisma.workflowInstance.deleteMany({ where: { requisitionId: id } })
  await prisma.requisition.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const existing = await prisma.requisition.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  if (!isAdmin && existing.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.requisition.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(updated)
}
