"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9ca3af",
  PENDING_APPROVAL: "#f59e0b",
  APPROVED: "#10b981",
  POSTED: "#059669",
  CANCELLED: "#ef4444",
  REJECTED: "#dc2626",
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"]

interface ChartData {
  statusCounts: { status: string; count: number }[]
  deptCounts: { dept: string; count: number }[]
  approvalByRole: { role: string; approved: number; rejected: number; rate: number }[]
  monthlyCounts: { month: string; count: number }[]
  bottleneckByRole: { role: string; avgDays: number }[]
  approvalTimeTrend: { month: string; avgDays: number }[]
}

export function AnalyticsCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Monthly submissions */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Monthly Submissions</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              cursor={{ fill: "#f3f4f6" }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Submissions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Status Breakdown</h3>
        {data.statusCounts.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.statusCounts}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${String(name ?? "").replace(/_/g, " ")} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.statusCounts.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value, name) => [value, String(name).replace(/_/g, " ")]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* By department */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">By Department</h3>
        {data.deptCounts.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.deptCounts}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Reqs" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Approval rate by role */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Approval Rate by Role</h3>
        {data.approvalByRole.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No approval data yet
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {data.approvalByRole.map(({ role, approved, rejected, rate }) => (
              <div key={role} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 capitalize">{role.toLowerCase()}</span>
                  <span className="text-muted-foreground text-xs">
                    {approved}/{approved + rejected} · <span className="font-semibold text-emerald-600">{rate}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval time trend */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Avg Approval Time Trend</h3>
          {data.approvalTimeTrend.length >= 2 &&
            data.approvalTimeTrend[data.approvalTimeTrend.length - 1].avgDays <
            data.approvalTimeTrend[0].avgDays && (
            <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              ↓ Improving
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.approvalTimeTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="d" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [`${v}d`, "Avg Days"]}
            />
            <Line
              type="monotone"
              dataKey="avgDays"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#6366f1" }}
              activeDot={{ r: 6 }}
              name="Avg Days"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottleneck by role */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Response Time by Role (days)</h3>
        {data.bottleneckByRole.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.bottleneckByRole}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="d" />
              <YAxis dataKey="role" type="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => [`${v}d`, "Avg Response"]}
              />
              <Bar dataKey="avgDays" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
