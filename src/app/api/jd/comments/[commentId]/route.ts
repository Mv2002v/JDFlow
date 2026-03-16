import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { commentId } = await params
  const body = await request.json()

  const comment = await prisma.jdComment.findUnique({ where: { id: commentId } })
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only author or HR/Admin can resolve
  const isAuthor = comment.authorId === session.user.id
  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isAuthor && !isPrivileged) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.jdComment.update({
    where: { id: commentId },
    data: {
      resolved: body.resolved ?? !comment.resolved,
    },
    include: { author: { select: { name: true, role: true } } },
  })

  return NextResponse.json(updated)
}
