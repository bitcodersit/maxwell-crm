type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
type TaskStatus = 'in-progress' | 'review' | 'delayed' | 'completed'
type GoalCycle = 'weekly' | 'monthly'

type TaskMilestone = {
  id: string
  text: string
  done: boolean
  doneBy?: string
}

type TaskResource = {
  id: string
  name: string
  size: string
  icon: string
}

type TaskItem = {
  id: number
  ref: string
  title: string
  category: string
  priority: TaskPriority
  status: TaskStatus
  assignee: string
  assigneeShort: string
  team: string
  pipeline: string
  dueDate: string
  summary: string
  description: string
  goalCycle: GoalCycle
  goalTargetUnits: number
  resources: TaskResource[]
  checklist: TaskMilestone[]
}

const seedTasks = (): TaskItem[] => [
  {
    id: 8291,
    ref: '#TASK-8291',
    title: 'Quarterly Sales Infrastructure Audit & Optimization',
    category: 'Operations',
    priority: 'high',
    status: 'in-progress',
    assignee: 'Taylor Wynn',
    assigneeShort: 'TW',
    team: 'Alpha Performance',
    pipeline: 'Strategic Sales',
    dueDate: '2026-05-12',
    summary: 'Infrastructure update',
    description:
      'Comprehensive review of current sales funnel architecture across all digital touchpoints. This task includes deep-diving into CRM automation logs to identify drop-off points in the lead qualification process.\n\nThe primary objective is to streamline the hand-off between automated marketing nurture campaigns and direct sales representatives. We need to ensure that no high-intent lead stays in the "Pending" state for more than 4 hours during standard operating windows.',
    goalCycle: 'weekly',
    goalTargetUnits: 450,
    resources: [
      {
        id: 'resource-1',
        name: 'sales_audit_v2.pdf',
        size: '2.4 MB',
        icon: 'i-lucide-file-text'
      },
      {
        id: 'resource-2',
        name: 'funnel_data.csv',
        size: '158 KB',
        icon: 'i-lucide-file-spreadsheet'
      }
    ],
    checklist: [
      { id: 'milestone-1', text: 'Initialize API connection to Salesforce Hub', done: true, doneBy: 'Taylor Wynn' },
      { id: 'milestone-2', text: 'Map lead metadata to internal CRM fields', done: true, doneBy: 'Taylor Wynn' },
      { id: 'milestone-3', text: 'Configure automated notification webhooks', done: true, doneBy: 'System Admin' },
      { id: 'milestone-4', text: 'Conduct stress test on high-traffic routing', done: false },
      { id: 'milestone-5', text: 'Final stakeholder presentation & approval', done: false }
    ]
  },
  {
    id: 8344,
    ref: '#TASK-8344',
    title: 'Enterprise API Migration',
    category: 'Backend',
    priority: 'critical',
    status: 'in-progress',
    assignee: 'Jordan Doe',
    assigneeShort: 'JD',
    team: 'Platform',
    pipeline: 'Core Services',
    dueDate: '2026-05-12',
    summary: 'Infrastructure update',
    description: 'Migrate API gateway and dependent CRM microservices to the new version with zero downtime.',
    goalCycle: 'weekly',
    goalTargetUnits: 120,
    resources: [],
    checklist: [
      { id: 'milestone-6', text: 'Prepare migration runbook', done: true, doneBy: 'Jordan Doe' },
      { id: 'milestone-7', text: 'Deploy staged canary release', done: false }
    ]
  },
  {
    id: 8352,
    ref: '#TASK-8352',
    title: 'Q3 Revenue Forecast',
    category: 'Finance',
    priority: 'high',
    status: 'delayed',
    assignee: 'Super Admin',
    assigneeShort: 'SA',
    team: 'Finance Ops',
    pipeline: 'Revenue',
    dueDate: '2026-05-09',
    summary: 'Financial analysis & projections',
    description: 'Produce Q3 forecast model with team-level breakdown and risk projections.',
    goalCycle: 'monthly',
    goalTargetUnits: 2000,
    resources: [],
    checklist: [
      { id: 'milestone-8', text: 'Collect historical conversion data', done: true, doneBy: 'Super Admin' },
      { id: 'milestone-9', text: 'Publish final forecast workbook', done: false }
    ]
  },
  {
    id: 8360,
    ref: '#TASK-8360',
    title: 'Mobile App UX Audit',
    category: 'Product',
    priority: 'medium',
    status: 'review',
    assignee: 'Reese Diaz',
    assigneeShort: 'RD',
    team: 'Mobile',
    pipeline: 'Experience',
    dueDate: '2026-05-15',
    summary: 'Customer feedback implementation',
    description: 'Review mobile onboarding flow and apply UX improvements from customer interviews.',
    goalCycle: 'weekly',
    goalTargetUnits: 90,
    resources: [],
    checklist: [
      { id: 'milestone-10', text: 'Consolidate interview themes', done: true, doneBy: 'Reese Diaz' },
      { id: 'milestone-11', text: 'Ship interaction prototype', done: false }
    ]
  },
  {
    id: 8380,
    ref: '#TASK-8380',
    title: 'Lead Assignment Automation',
    category: 'Automation',
    priority: 'low',
    status: 'completed',
    assignee: 'Vielka Mooney',
    assigneeShort: 'VM',
    team: 'Sales Ops',
    pipeline: 'Lead Management',
    dueDate: '2026-05-06',
    summary: 'Auto-routing rules',
    description: 'Deliver rule-based lead assignment automation for fast SLA response.',
    goalCycle: 'monthly',
    goalTargetUnits: 600,
    resources: [],
    checklist: [
      { id: 'milestone-12', text: 'Define routing rules', done: true, doneBy: 'Vielka Mooney' },
      { id: 'milestone-13', text: 'Deploy and monitor assignment logs', done: true, doneBy: 'Vielka Mooney' }
    ]
  }
]

export const useTasksDemo = () => {
  const tasks = useState<TaskItem[]>('tasks-demo', () => seedTasks())

  const statusMeta: Record<TaskStatus, { label: string; color: 'success' | 'warning' | 'error' | 'neutral' | 'primary' }> =
    {
      'in-progress': { label: 'In Progress', color: 'primary' },
      review: { label: 'Review', color: 'warning' },
      delayed: { label: 'Delayed', color: 'error' },
      completed: { label: 'Completed', color: 'success' }
    }

  const priorityMeta: Record<TaskPriority, { label: string; color: 'success' | 'warning' | 'error' | 'neutral' }> = {
    critical: { label: 'Critical', color: 'error' },
    high: { label: 'High', color: 'warning' },
    medium: { label: 'Medium', color: 'neutral' },
    low: { label: 'Low', color: 'success' }
  }

  const performers = computed(() => [
    { name: 'Vielka Mooney', role: 'Senior Salesman', active: 42, hitRate: 115 },
    { name: 'India Oliver', role: 'Mid Salesman', active: 28, hitRate: 92 },
    { name: 'Taylor Wynn', role: 'Account Manager', active: 15, hitRate: 78 }
  ])

  const metrics = computed(() => {
    const total = tasks.value.length
    const inProgress = tasks.value.filter(task => task.status === 'in-progress').length
    const completed = tasks.value.filter(task => task.status === 'completed').length
    const hitRate = total ? Math.round((completed / total) * 100) : 0

    return {
      total,
      inProgress,
      completed,
      hitRate
    }
  })

  const createTask = (input: {
    title: string
    description: string
    assignee: string
    goalCycle: GoalCycle
    milestones: string[]
  }) => {
    const nextId = Math.max(0, ...tasks.value.map(task => task.id)) + 1
    const normalizedMilestones = input.milestones.filter(Boolean)

    const task: TaskItem = {
      id: nextId,
      ref: `#TASK-${nextId}`,
      title: input.title,
      category: 'Operations',
      priority: 'high',
      status: 'in-progress',
      assignee: input.assignee,
      assigneeShort: input.assignee
        .split(' ')
        .map(part => part[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      team: 'Sales Team',
      pipeline: 'General',
      dueDate: new Date().toISOString().slice(0, 10),
      summary: 'Newly created task',
      description: input.description,
      goalCycle: input.goalCycle,
      goalTargetUnits: input.goalCycle === 'weekly' ? 100 : 400,
      resources: [],
      checklist: normalizedMilestones.map((text, index) => ({
        id: `milestone-${nextId}-${index + 1}`,
        text,
        done: false
      }))
    }

    tasks.value = [task, ...tasks.value]
    return task
  }

  return {
    tasks,
    metrics,
    performers,
    statusMeta,
    priorityMeta,
    createTask
  }
}

export type { TaskItem, TaskPriority, TaskStatus, GoalCycle, TaskMilestone }
