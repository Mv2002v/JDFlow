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

const PatchSchema = z.object({
  name:       z.string().min(1).optional(),
  department: z.string().nullable().optional(),
  isDefault:  z.boolean().optional(),
  steps:      z.array(StepSchema).min(1).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const existing = await prisma.approvalChain.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, department, isDefault, steps } = parsed.data

  const updated = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.approvalChain.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      })
    }
    if (steps) {
      await tx.approvalChainStep.deleteMany({ where: { chainId: id } })
      await tx.approvalChainStep.createMany({
        data: steps.map(s => ({ ...s, chainId: id })),
      })
    }
    return tx.approvalChain.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(department !== undefined && { department }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const chain = await prisma.approvalChain.findUnique({ where: { id } })
  if (!chain) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (chain.isDefault) {
    const total = await prisma.approvalChain.count()
    if (total <= 1) {
      return NextResponse.json({ error: "Cannot delete the only default chain" }, { status: 400 })
    }
  }

  await prisma.approvalChain.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
