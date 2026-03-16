import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { resubmitWorkflow } from "@/lib/workflow"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const req = await prisma.requisition.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = req.createdById === session.user.id
  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (req.status !== "CANCELLED") {
    return NextResponse.json({ error: "Only CANCELLED reqs can be resubmitted" }, { status: 400 })
  }

  await resubmitWorkflow(id, {
    salaryMin: body.salaryMin ?? undefined,
    salaryMax: body.salaryMax ?? undefined,
    justification: body.justification ?? undefined,
  })

  const updated = await prisma.requisition.findUnique({
    where: { id },
    include: {
      workflows: {
        where: { isLatest: true },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      },
    },
  })

  return NextResponse.json(updated)
}
