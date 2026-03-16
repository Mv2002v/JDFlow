import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ROLE_MAP: Record<string, string> = {
    DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
    FINANCE: "FINANCE",
    HR: "HR",
    ADMIN: "HR",
  }

  const approverRole = ROLE_MAP[session.user.role]
  if (!approverRole) return NextResponse.json([])

  const steps = await prisma.approvalStep.findMany({
    where: { approverRole, status: "PENDING" },
    include: {
      workflow: {
        include: {
          requisition: { include: { createdBy: { select: { name: true } } } },
        },
      },
    },
    orderBy: { deadlineAt: "asc" },
  })

  return NextResponse.json(steps)
}
