import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.jdComment.deleteMany()
  await prisma.jdVersion.deleteMany()
  await prisma.jobDescription.deleteMany()
  await prisma.approvalStep.deleteMany()
  await prisma.workflowInstance.deleteMany()
  await prisma.requisition.deleteMany()
  await prisma.jdTemplate.deleteMany()
  await prisma.approvalChainStep.deleteMany()
  await prisma.approvalChain.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash("demo123", 10)

  // ─── Users ──────────────────────────────────────────
  const sarah = await prisma.user.create({
    data: {
      email: "sarah@jdflow.demo",
      name: "Sarah Chen",
      password,
      role: "HIRING_MANAGER",
      department: "Engineering",
    },
  })

  const marcus = await prisma.user.create({
    data: {
      email: "marcus@jdflow.demo",
      name: "Marcus Johnson",
      password,
      role: "DEPARTMENT_HEAD",
      department: "Engineering",
    },
  })

  const priya = await prisma.user.create({
    data: {
      email: "priya@jdflow.demo",
      name: "Priya Patel",
      password,
      role: "FINANCE",
      department: "Finance",
    },
  })

  const alex = await prisma.user.create({
    data: {
      email: "alex@jdflow.demo",
      name: "Alex Rivera",
      password,
      role: "HR",
      department: "People Operations",
    },
  })

  await prisma.user.create({
    data: {
      email: "jordan@jdflow.demo",
      name: "Jordan Kim",
      password,
      role: "RECRUITER",
      department: "People Operations",
    },
  })

  await prisma.user.create({
    data: {
      email: "taylor@jdflow.demo",
      name: "Taylor Brooks",
      password,
      role: "ADMIN",
      department: "People Operations",
    },
  })

  // ─── Default Approval Chain ─────────────────────────
  await prisma.approvalChain.create({
    data: {
      name: "Default Approval Chain",
      isDefault: true,
      steps: {
        create: [
          { stepOrder: 0, stepLabel: "Department Head Approval", approverRole: "DEPARTMENT_HEAD", deadlineDays: 2 },
          { stepOrder: 1, stepLabel: "Finance Review",           approverRole: "FINANCE",         deadlineDays: 2 },
          { stepOrder: 2, stepLabel: "HR Final Sign-off",        approverRole: "HR",              deadlineDays: 1 },
        ],
      },
    },
  })

  // ─── Engineering Chain (faster, no Finance for < $150k) ─
  await prisma.approvalChain.create({
    data: {
      name: "Engineering Fast-Track",
      department: "Engineering",
      steps: {
        create: [
          { stepOrder: 0, stepLabel: "Engineering Manager Approval", approverRole: "DEPARTMENT_HEAD", deadlineDays: 1 },
          { stepOrder: 1, stepLabel: "Finance Review",               approverRole: "FINANCE",         deadlineDays: 2 },
          { stepOrder: 2, stepLabel: "HR Sign-off",                  approverRole: "HR",              deadlineDays: 1 },
        ],
      },
    },
  })

  // ─── Requisition 1: POSTED (completed flow) ────────
  const req1 = await prisma.requisition.create({
    data: {
      title: "Senior Frontend Engineer",
      department: "Engineering",
      team: "Platform UI",
      level: "SENIOR",
      type: "NEW_ROLE",
      justification:
        "Our frontend team is at capacity with 3 engineers supporting 5 product squads. We've deferred the design system migration and dashboard rewrite due to bandwidth constraints. A senior hire would unblock both initiatives and mentor our two junior devs.",
      location: "San Francisco, CA",
      remotePolicy: "HYBRID",
      salaryMin: 160000,
      salaryMax: 200000,
      targetStartDate: new Date("2026-05-01"),
      status: "POSTED",
      createdById: sarah.id,
    },
  })

  await prisma.workflowInstance.create({
    data: {
      requisitionId: req1.id,
      currentStep: 3,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 2 * 86400000),
      steps: {
        create: [
          {
            stepOrder: 0,
            stepLabel: "Department Head Approval",
            approverRole: "DEPARTMENT_HEAD",
            status: "APPROVED",
            assigneeId: marcus.id,
            deadlineAt: new Date(Date.now() - 10 * 86400000),
            decidedAt: new Date(Date.now() - 9 * 86400000),
            comment: "Strong hire. Approved.",
          },
          {
            stepOrder: 1,
            stepLabel: "Finance Review",
            approverRole: "FINANCE",
            status: "APPROVED",
            assigneeId: priya.id,
            deadlineAt: new Date(Date.now() - 7 * 86400000),
            decidedAt: new Date(Date.now() - 6 * 86400000),
            comment: "Within budget for Q2.",
          },
          {
            stepOrder: 2,
            stepLabel: "HR Final Sign-off",
            approverRole: "HR",
            status: "APPROVED",
            assigneeId: alex.id,
            deadlineAt: new Date(Date.now() - 4 * 86400000),
            decidedAt: new Date(Date.now() - 3 * 86400000),
          },
        ],
      },
    },
  })

  await prisma.jobDescription.create({
    data: {
      requisitionId: req1.id,
      createdById: sarah.id,
      aiGenerated: true,
      status: "POSTED",
      complianceScore: 9.5,
      inclusionScore: 8.8,
      readabilityScore: 8.2,
      content: {
        title: "Senior Frontend Engineer",
        summary:
          "We're looking for a Senior Frontend Engineer to join our Platform UI team and lead the next generation of our web application. You'll architect scalable frontend systems, mentor junior engineers, and drive our design system migration.",
        responsibilities: [
          "Lead the design system migration from legacy components to a modern, accessible component library",
          "Architect and implement complex, performant UI features for our core product dashboard",
          "Mentor 2 junior frontend developers through code reviews, pair programming, and technical guidance",
          "Collaborate with product designers and backend engineers to deliver seamless user experiences",
          "Drive frontend technical decisions including framework choices, testing strategies, and performance optimization",
          "Contribute to engineering-wide initiatives around developer experience and code quality",
        ],
        requirements: [
          "5+ years of professional frontend development experience",
          "Strong expertise in React and TypeScript",
          "Experience building and maintaining component libraries or design systems",
          "Solid understanding of web accessibility standards (WCAG)",
          "Experience with modern build tools and CI/CD pipelines",
          "Track record of mentoring other engineers",
        ],
        preferred: [
          "Experience with Next.js and server-side rendering",
          "Familiarity with animation libraries (Framer Motion)",
          "Contributions to open-source projects",
        ],
        benefits: [
          "Competitive salary: $160,000 - $200,000",
          "Equity package with 4-year vesting",
          "Comprehensive health, dental, and vision coverage",
          "Flexible hybrid work arrangement (3 days in-office)",
          "$2,000 annual learning and development budget",
          "Home office setup stipend",
        ],
        salaryRange: "$160,000 - $200,000",
        location: "San Francisco, CA (Hybrid)",
        equalOpportunity:
          "We are an equal opportunity employer committed to building a diverse and inclusive team. We welcome applications from all qualified candidates regardless of race, color, religion, gender identity, sexual orientation, national origin, disability, or veteran status.",
      },
      rawText:
        "Senior Frontend Engineer — Platform UI\n\nWe're looking for a Senior Frontend Engineer to join our Platform UI team...",
    },
  })

  // ─── Requisition 2: JD_IN_PROGRESS (ready for AI demo) ──
  const req2 = await prisma.requisition.create({
    data: {
      title: "Product Designer",
      department: "Design",
      team: "Product Design",
      level: "MID",
      type: "NEW_ROLE",
      justification:
        "Our design team of 4 is supporting 6 product squads. We've had to deprioritize 3 major initiatives this quarter due to design capacity. Adding a mid-level designer would let us cover all active squads and reduce the turnaround time on design reviews from 2 weeks to 3 days.",
      location: "New York, NY",
      remotePolicy: "REMOTE",
      salaryMin: 120000,
      salaryMax: 155000,
      targetStartDate: new Date("2026-06-01"),
      status: "APPROVED",
      createdById: sarah.id,
    },
  })

  await prisma.workflowInstance.create({
    data: {
      requisitionId: req2.id,
      currentStep: 3,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 1 * 86400000),
      steps: {
        create: [
          {
            stepOrder: 0,
            stepLabel: "Department Head Approval",
            approverRole: "DEPARTMENT_HEAD",
            status: "APPROVED",
            assigneeId: marcus.id,
            deadlineAt: new Date(Date.now() - 5 * 86400000),
            decidedAt: new Date(Date.now() - 4 * 86400000),
          },
          {
            stepOrder: 1,
            stepLabel: "Finance Review",
            approverRole: "FINANCE",
            status: "APPROVED",
            assigneeId: priya.id,
            deadlineAt: new Date(Date.now() - 3 * 86400000),
            decidedAt: new Date(Date.now() - 2 * 86400000),
          },
          {
            stepOrder: 2,
            stepLabel: "HR Final Sign-off",
            approverRole: "HR",
            status: "APPROVED",
            assigneeId: alex.id,
            deadlineAt: new Date(Date.now() - 1 * 86400000),
            decidedAt: new Date(Date.now() - 1 * 86400000),
          },
        ],
      },
    },
  })

  // ─── Requisition 3: PENDING_APPROVAL (step 2 of 3) ──
  const req3 = await prisma.requisition.create({
    data: {
      title: "Data Analyst",
      department: "Engineering",
      team: "Data & Analytics",
      level: "MID",
      type: "BACKFILL",
      justification:
        "Backfill for Jamie Torres who left last month. The data team is currently unable to support marketing's attribution modeling and finance's quarterly forecasting without this role. Both departments have escalated.",
      location: "Austin, TX",
      remotePolicy: "HYBRID",
      salaryMin: 95000,
      salaryMax: 125000,
      targetStartDate: new Date("2026-05-15"),
      status: "PENDING_APPROVAL",
      createdById: sarah.id,
    },
  })

  await prisma.workflowInstance.create({
    data: {
      requisitionId: req3.id,
      currentStep: 1,
      status: "ACTIVE",
      steps: {
        create: [
          {
            stepOrder: 0,
            stepLabel: "Department Head Approval",
            approverRole: "DEPARTMENT_HEAD",
            status: "APPROVED",
            assigneeId: marcus.id,
            deadlineAt: new Date(Date.now() - 1 * 86400000),
            decidedAt: new Date(Date.now() - 12 * 3600000),
            comment: "Critical backfill. Fast-track approved.",
          },
          {
            stepOrder: 1,
            stepLabel: "Finance Review",
            approverRole: "FINANCE",
            status: "PENDING",
            assigneeId: priya.id,
            deadlineAt: new Date(Date.now() + 1 * 86400000),
          },
          {
            stepOrder: 2,
            stepLabel: "HR Final Sign-off",
            approverRole: "HR",
            status: "PENDING",
            assigneeId: alex.id,
            deadlineAt: new Date(Date.now() + 3 * 86400000),
          },
        ],
      },
    },
  })

  // ─── Requisition 4: DRAFT ──────────────────────────
  await prisma.requisition.create({
    data: {
      title: "DevOps Engineer",
      department: "Engineering",
      team: "Infrastructure",
      level: "SENIOR",
      type: "NEW_ROLE",
      justification:
        "Our infrastructure is managed by a single engineer. We need redundancy and capacity to migrate to Kubernetes this year.",
      location: "Remote",
      remotePolicy: "REMOTE",
      salaryMin: 150000,
      salaryMax: 190000,
      targetStartDate: new Date("2026-07-01"),
      status: "DRAFT",
      createdById: sarah.id,
    },
  })

  // ─── Requisition 5: APPROVED (ready for JD creation) ──
  await prisma.requisition.create({
    data: {
      title: "Marketing Manager",
      department: "Marketing",
      team: "Growth",
      level: "MANAGER",
      type: "NEW_ROLE",
      justification:
        "We're expanding into the mid-market segment and need a marketing manager to build and execute our go-to-market strategy. Currently no one owns demand generation.",
      location: "Chicago, IL",
      remotePolicy: "HYBRID",
      salaryMin: 110000,
      salaryMax: 140000,
      targetStartDate: new Date("2026-06-15"),
      status: "APPROVED",
      createdById: sarah.id,
    },
  })

  // ─── Requisition 6: CANCELLED (Finance rejected — resubmit scenario) ──
  const req6 = await prisma.requisition.create({
    data: {
      title: "Staff Machine Learning Engineer",
      department: "Engineering",
      team: "AI Platform",
      level: "SENIOR",
      type: "NEW_ROLE",
      justification:
        "We need a staff-level ML engineer to own our recommendation engine and model infrastructure. Current model latency is 800ms; the target is 100ms. This role is critical for the Q3 roadmap.",
      location: "San Francisco, CA",
      remotePolicy: "HYBRID",
      salaryMin: 280000,
      salaryMax: 340000,
      targetStartDate: new Date("2026-07-01"),
      status: "CANCELLED",
      revisionCount: 1,
      createdById: sarah.id,
    },
  })

  await prisma.workflowInstance.create({
    data: {
      requisitionId: req6.id,
      revision: 1,
      isLatest: true,
      currentStep: 1,
      status: "REJECTED",
      completedAt: new Date(Date.now() - 1 * 86400000),
      steps: {
        create: [
          {
            stepOrder: 0,
            stepLabel: "Department Head Approval",
            approverRole: "DEPARTMENT_HEAD",
            status: "APPROVED",
            assigneeId: marcus.id,
            deadlineAt: new Date(Date.now() - 4 * 86400000),
            decidedAt: new Date(Date.now() - 3 * 86400000),
            comment: "Team needs this urgently. Approved.",
          },
          {
            stepOrder: 1,
            stepLabel: "Finance Review",
            approverRole: "FINANCE",
            status: "REJECTED",
            assigneeId: priya.id,
            deadlineAt: new Date(Date.now() - 2 * 86400000),
            decidedAt: new Date(Date.now() - 1 * 86400000),
            comment: "Salary band of $280k–$340k exceeds our senior IC cap by 30%. Please revise to $210k–$260k or provide a compensation exception memo.",
          },
          {
            stepOrder: 2,
            stepLabel: "HR Final Sign-off",
            approverRole: "HR",
            status: "PENDING",
            assigneeId: alex.id,
            deadlineAt: new Date(Date.now() + 2 * 86400000),
          },
        ],
      },
    },
  })

  await prisma.notification.create({
    data: {
      userId: sarah.id,
      type: "approval_rejected",
      title: "Staff ML Engineer was rejected",
      body: "Reason: Salary band of $280k–$340k exceeds our senior IC cap by 30%.",
      actionUrl: `/dashboard/requisitions/${req6.id}`,
      read: false,
      createdAt: new Date(Date.now() - 1 * 86400000),
    },
  })

  // ─── JD Templates ──────────────────────────────────
  await prisma.jdTemplate.createMany({
    data: [
      {
        name: "Engineering — Individual Contributor",
        department: "Engineering",
        roleFamily: "IC",
        content: {
          sections: [
            "About the Role",
            "What You'll Do",
            "What We're Looking For",
            "Nice to Have",
            "Benefits",
          ],
          tone: "professional yet approachable",
        },
      },
      {
        name: "Design — Product Design",
        department: "Design",
        roleFamily: "IC",
        content: {
          sections: [
            "About the Role",
            "Your Impact",
            "What You Bring",
            "Bonus Points",
            "Perks & Benefits",
          ],
          tone: "creative and collaborative",
        },
      },
      {
        name: "Marketing — General",
        department: "Marketing",
        roleFamily: "IC",
        content: {
          sections: [
            "The Opportunity",
            "Responsibilities",
            "Qualifications",
            "Preferred",
            "What We Offer",
          ],
          tone: "energetic and results-oriented",
        },
      },
    ],
  })

  // ─── Notifications ─────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: sarah.id,
        type: "approval_complete",
        title: "Product Designer approved",
        body: "All approvals are complete. You can now create the job description.",
        actionUrl: `/dashboard/requisitions/${req2.id}`,
        read: false,
        createdAt: new Date(Date.now() - 2 * 3600000),
      },
      {
        userId: sarah.id,
        type: "step_approved",
        title: "Marcus approved Data Analyst",
        body: "Department Head approval received. Waiting on Finance review.",
        actionUrl: `/dashboard/requisitions/${req3.id}`,
        read: false,
        createdAt: new Date(Date.now() - 12 * 3600000),
      },
      {
        userId: sarah.id,
        type: "jd_posted",
        title: "Sr. Frontend Engineer posted",
        body: "The job description has been posted and is now live.",
        actionUrl: `/dashboard/requisitions/${req1.id}`,
        read: true,
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        userId: sarah.id,
        type: "step_approved",
        title: "Priya approved Sr. Frontend Engineer",
        body: "Finance review complete.",
        read: true,
        createdAt: new Date(Date.now() - 6 * 86400000),
      },
    ],
  })

  console.log("Seed complete!")
  console.log("")
  console.log("Demo login:")
  console.log("  Email:    sarah@jdflow.demo")
  console.log("  Password: demo123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
