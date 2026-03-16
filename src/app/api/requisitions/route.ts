import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(3),
  department: z.string().min(2),
  location: z.string().min(2),
  type: z.enum(["NEW_ROLE", "BACKFILL", "CONTRACTOR", "CONVERSION"]),
  level: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "VP"]),
  remotePolicy: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  headcount: z.coerce.number().int().min(1).max(50),
  salaryMin: z.coerce.number().optional().nullable(),
  salaryMax: z.coerce.number().optional().nullable(),
  justification: z.string().min(10),
  hiringManagerNotes: z.string().optional().nullable(),
  targetStartDate: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  const reqs = await prisma.requisition.findMany({
    where: isAdmin ? {} : { createdById: session.user.id },
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(reqs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const requisition = await prisma.requisition.create({
    data: {
      title: data.title,
      department: data.department,
      location: data.location,
      type: data.type,
      level: data.level,
      remotePolicy: data.remotePolicy,
      headcount: data.headcount,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      justification: data.justification,
      hiringManagerNotes: data.hiringManagerNotes ?? null,
      targetStartDate: data.targetStartDate ? new Date(data.targetStartDate) : null,
      status: "DRAFT",
      createdById: session.user.id,
    },
  })

  return NextResponse.json(requisition, { status: 201 })
}
