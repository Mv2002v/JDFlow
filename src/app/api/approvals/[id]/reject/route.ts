import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { processStepAction } from "@/lib/workflow"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const comment = body.comment as string | undefined

  const step = await prisma.approvalStep.findUnique({ where: { id } })
  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (step.status !== "PENDING") {
    return NextResponse.json({ error: "Step is not pending" }, { status: 400 })
  }

  await processStepAction(id, "reject", comment)
  return NextResponse.json({ ok: true })
}
