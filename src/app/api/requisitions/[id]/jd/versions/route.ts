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

  const jd = await prisma.jobDescription.findUnique({ where: { requisitionId: id } })
  if (!jd) return NextResponse.json([])

  const versions = await prisma.jdVersion.findMany({
    where: { jobDescriptionId: jd.id },
    include: { savedBy: { select: { name: true, role: true } } },
    orderBy: { version: "desc" },
  })

  return NextResponse.json(versions)
}
