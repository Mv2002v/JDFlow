import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BookTemplate, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const templates = await prisma.jdTemplate.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Reusable job description templates for common roles.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <BookTemplate className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">No templates yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Templates will appear here once created by HR or Admins.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <div
              key={template.id}
              className="rounded-xl border bg-white p-5 space-y-3 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                {template.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                {template.department ? (
                  <Badge variant="secondary" className="text-xs">{template.department}</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">General</Badge>
                )}
                <span className="text-[10px] text-muted-foreground">{formatDate(template.createdAt.toISOString())}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
