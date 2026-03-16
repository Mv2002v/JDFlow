import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const StepSchema = z.object({
  stepOrder:    z.number().int().min(0),
  stepLabel:    z.string().min(1),
  approverRole: z.string().min(1),
  deadlineDays: z.number().int().min(1).max(30),
})

const ChainSchema = z.object({
  name:       z.string().min(1),
  department: z.string().optional().nullable(),
  isDefault:  z.boolean().optional(),
  steps:      z.array(StepSchema).min(1, "At least one step is required"),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const chains = await prisma.approvalChain.findMany({
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(chains)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = ChainSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { name, department, isDefault, steps } = parsed.data

  const chain = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.approvalChain.updateMany({ data: { isDefault: false } })
    }
    return tx.approvalChain.create({
      data: {
        name,
        department: department ?? null,
        isDefault: isDefault ?? false,
        steps: { create: steps },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    })
  })

  return NextResponse.json(chain, { status: 201 })
}
