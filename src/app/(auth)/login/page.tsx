"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})
type FormData = z.infer<typeof schema>

const DEMO_EMAIL = "sarah@jdflow.demo"
const DEMO_PASSWORD = "demo123"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      toast.error("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  function fillDemo() {
    setValue("email", DEMO_EMAIL)
    setValue("password", DEMO_PASSWORD)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">JDFlow</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            From &ldquo;I need to hire&rdquo; to job posted — in days, not weeks.
          </h2>
          <p className="text-indigo-100 text-lg">
            AI-powered job requisition approval and job description generation platform.
          </p>
          <ul className="space-y-3">
            {[
              "Automated approval workflows with deadline tracking",
              "AI-generated job descriptions in seconds",
              "Real-time compliance and inclusion analysis",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-0.5 text-indigo-200 shrink-0" />
                <span className="text-indigo-100">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-indigo-200 text-sm">
          Portfolio project by a full-stack developer — built with Next.js, Prisma & Claude AI
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">JDFlow</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          {/* Demo login button */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-800">Try the demo</span>
            </div>
            <p className="text-xs text-indigo-600">
              Pre-loaded with realistic data — approvals, JDs, analytics, and more.
            </p>
            <Button
              variant="outline"
              className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              onClick={fillDemo}
              type="button"
            >
              Fill Demo Credentials
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Demo credentials: <span className="font-mono">sarah@jdflow.demo</span> / <span className="font-mono">demo123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
