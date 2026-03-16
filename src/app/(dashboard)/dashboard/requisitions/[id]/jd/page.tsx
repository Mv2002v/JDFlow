import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { JdEditor } from "@/components/jd/jd-editor"

export default async function JdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const req = await prisma.requisition.findUnique({
    where: { id },
    include: { jobDescription: true },
  })

  if (!req) notFound()

  const isAdmin = ["ADMIN", "HR"].includes(session.user.role)
  if (!isAdmin && req.createdById !== session.user.id) notFound()

  const jd = req.jobDescription

  return (
    <JdEditor
      reqId={id}
      reqTitle={req.title}
      reqDepartment={req.department}
      existingContent={jd?.rawText ?? null}
      jdStatus={jd?.status ?? null}
      jdId={jd?.id ?? null}
      userRole={session.user.role}
      userId={session.user.id}
      createdById={req.createdById}
    />
  )
}
