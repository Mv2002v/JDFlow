import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createWorkflow } from "@/lib/workflow"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const req = await prisma.requisition.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (req.createdById !== session.user.id && !["ADMIN", "HR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (req.status !== "DRAFT") {
    return NextResponse.json({ error: "Only DRAFT requisitions can be submitted" }, { status: 400 })
  }

  await createWorkflow(id)

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
