import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Download,
  Globe2,
  Flag,
  Filter,
  History,
  LayoutDashboard,
  Link2,
  ListChecks,
  PieChart,
  Plus,
  Search,
  SlidersHorizontal,
  SquarePen,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import './App.css'

type Status = 'todo' | 'doing' | 'review' | 'done'
type Priority = 'high' | 'medium' | 'low'
type View = 'dashboard' | 'tasks' | 'calendar' | 'people'
type DateFilter = 'all' | 'today' | 'week' | 'overdue'

type ChecklistItem = {
  done: boolean
  id: string
  text: string
}

type ActivityLog = {
  id: string
  text: string
  timestamp: string
}

type Attachment = {
  id: string
  label: string
  url: string
}

type Task = {
  attachments: Attachment[]
  checklist: ChecklistItem[]
  id: string
  goal: string
  title: string
  project: string
  owner: string
  startDate: string
  dueDate: string
  status: Status
  priority: Priority
  logs: ActivityLog[]
  notes: string
}

const statusOptions: Array<{ value: Status; label: string }> = [
  { value: 'todo', label: '할 일' },
  { value: 'doing', label: '진행 중' },
  { value: 'review', label: '검토' },
  { value: 'done', label: '완료' },
]

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
]

const dateFilterOptions: Array<{ value: DateFilter; label: string }> = [
  { value: 'all', label: '전체 기간' },
  { value: 'today', label: '오늘 마감' },
  { value: 'week', label: '7일 이내' },
  { value: 'overdue', label: '지연' },
]

const projectPresets = [
  '일반 업무',
  '개발',
  '영상제작',
  '디자인',
  '마케팅',
  '운영',
]

const seedMembers = ['민지', '준호', '서연', '태오', '하린']

const seedTasks: Task[] = [
  {
    attachments: [
      { id: 'task-1-link-1', label: '주간 운영 일정표', url: 'https://example.com/weekly-ops' },
    ],
    checklist: [
      { id: 'task-1-check-1', text: '이번 주 우선순위 업무 정리', done: true },
      { id: 'task-1-check-2', text: '담당자별 마감 일정 공유', done: false },
    ],
    goal: '일반 운영 업무와 제작 업무가 같은 일정표 안에서 움직이게 한다.',
    id: 'task-1',
    logs: [{ id: 'task-1-log-1', text: '주간 업무 초안 작성', timestamp: '2026-05-13' }],
    title: '주간 업무 일정 확정',
    project: '일반 업무',
    owner: '민지',
    startDate: '2026-05-13',
    dueDate: '2026-05-15',
    status: 'doing',
    priority: 'high',
    notes: '광고 소재 전달 일정까지 함께 확인',
  },
  {
    attachments: [
      { id: 'task-2-link-1', label: 'GitHub 이슈 목록', url: 'https://example.com/dev-issues' },
    ],
    checklist: [
      { id: 'task-2-check-1', text: '재현 조건 정리', done: true },
      { id: 'task-2-check-2', text: '수정 후 빌드 확인', done: false },
    ],
    goal: '웹앱에서 발견된 문제를 재현 가능한 단위로 고치고 배포한다.',
    id: 'task-2',
    logs: [{ id: 'task-2-log-1', text: '오류 재현 조건 확인', timestamp: '2026-05-13' }],
    title: '업무 보드 저장 오류 점검',
    project: '개발',
    owner: '준호',
    startDate: '2026-05-13',
    dueDate: '2026-05-18',
    status: 'review',
    priority: 'medium',
    notes: '반복 문의 12개를 우선 반영',
  },
  {
    attachments: [],
    checklist: [
      { id: 'task-3-check-1', text: '촬영본 폴더 정리', done: false },
      { id: 'task-3-check-2', text: '1차 편집본 출력', done: false },
    ],
    goal: '영상 제작물이 검토 가능한 1차 편집본까지 진행되게 한다.',
    id: 'task-3',
    logs: [],
    title: '뮤직비디오 1차 편집',
    project: '영상제작',
    owner: '서연',
    startDate: '2026-05-16',
    dueDate: '2026-05-20',
    status: 'todo',
    priority: 'medium',
    notes: '팀별 성과와 병목을 짧게 수집',
  },
  {
    attachments: [
      { id: 'task-4-link-1', label: '디자인 참고 자료', url: 'https://example.com/storyboard' },
    ],
    checklist: [
      { id: 'task-4-check-1', text: '장면별 컷 구성 확인', done: true },
      { id: 'task-4-check-2', text: '자막/가사 타이밍 검토', done: false },
    ],
    goal: '편집자가 바로 작업할 수 있는 장면 흐름과 타이밍을 확정한다.',
    id: 'task-4',
    logs: [{ id: 'task-4-log-1', text: '스토리보드 초안 확인', timestamp: '2026-05-13' }],
    title: '영상 스토리보드 검토',
    project: '영상제작',
    owner: '태오',
    startDate: '2026-05-13',
    dueDate: '2026-05-14',
    status: 'doing',
    priority: 'high',
    notes: '모바일 환경 우선 확인',
  },
  {
    attachments: [
      { id: 'task-5-link-1', label: '배포 체크리스트', url: 'https://example.com/release-checklist' },
    ],
    checklist: [
      { id: 'task-5-check-1', text: 'Cloudflare 배포 확인', done: true },
      { id: 'task-5-check-2', text: '공유 링크 전달', done: true },
    ],
    goal: '웹에서 팀원들이 같은 업무 보드를 안정적으로 사용하게 한다.',
    id: 'task-5',
    logs: [{ id: 'task-5-log-1', text: '배포 확인 완료', timestamp: '2026-05-13' }],
    title: '업무 보드 웹 배포 확인',
    project: '개발',
    owner: '하린',
    startDate: '2026-05-13',
    dueDate: '2026-05-22',
    status: 'done',
    priority: 'low',
    notes: '신규 입사자 피드백 반영 완료',
  },
]

const tasksStorageKey = 'team-task-manager.tasks'
const membersStorageKey = 'team-task-manager.members'
const pinSessionKey = 'team-task-manager.pin-ok'
const requireShareKey = import.meta.env.VITE_REQUIRE_SHARE_KEY === 'true'
const requirePin = import.meta.env.VITE_REQUIRE_PIN === 'true'
const boardPin = import.meta.env.VITE_BOARD_PIN ?? '2580'

type BoardPayload = {
  members: string[]
  tasks: Task[]
}

type SyncState = 'local' | 'loading' | 'synced' | 'saving' | 'error'

function readStorage<T>(key: string, fallback: T) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

function normalizeTasks(tasks: Task[]) {
  return tasks.map((task) => ({
    ...task,
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    goal: task.goal ?? '',
    logs: Array.isArray(task.logs) ? task.logs : [],
    startDate: task.startDate ?? task.dueDate,
  }))
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createEmptyTask(defaultOwner = ''): Omit<Task, 'id'> {
  const start = new Date()
  const due = new Date()
  due.setDate(due.getDate() + 3)

  return {
    attachments: [],
    checklist: [],
    goal: '',
    title: '',
    project: '일반 업무',
    owner: defaultOwner,
    startDate: toDateInputValue(start),
    dueDate: toDateInputValue(due),
    status: 'todo',
    priority: 'medium',
    logs: [],
    notes: '',
  }
}

function getDaysLeft(dueDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function formatDue(dueDate: string) {
  const daysLeft = getDaysLeft(dueDate)

  if (daysLeft < 0) return `${Math.abs(daysLeft)}일 지남`
  if (daysLeft === 0) return '오늘'
  if (daysLeft === 1) return '내일'
  return `${daysLeft}일 남음`
}

function formatCalendarDate(dateValue: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateValue}T00:00:00`))
}

function formatAxisDate(dateValue: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateValue}T00:00:00`))
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function diffDays(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)
}

function escapeCsvCell(value: string | number) {
  const text = String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function getShareKey() {
  return new URLSearchParams(window.location.search).get('key')?.trim() ?? ''
}

function getPinSessionKey(shareKey: string) {
  return `${pinSessionKey}:${shareKey}`
}

function isBoardPayload(value: unknown): value is BoardPayload {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<BoardPayload>
  return Array.isArray(candidate.tasks) && Array.isArray(candidate.members)
}

async function fetchSharedBoard(key: string, pin: string) {
  const response = await fetch(`/api/board?key=${encodeURIComponent(key)}`, {
    headers: {
      'x-board-pin': pin,
    },
  })
  if (!response.ok) throw new Error('공유 보드를 불러오지 못했습니다')

  const payload = (await response.json()) as unknown
  if (!isBoardPayload(payload)) throw new Error('공유 보드 데이터 형식이 다릅니다')

  return {
    members: payload.members,
    tasks: normalizeTasks(payload.tasks),
  }
}

async function saveSharedBoard(key: string, payload: BoardPayload, pin: string) {
  const response = await fetch(`/api/board?key=${encodeURIComponent(key)}`, {
    body: JSON.stringify(payload),
    headers: {
      'content-type': 'application/json',
      'x-board-pin': pin,
    },
    method: 'PUT',
  })

  if (!response.ok) throw new Error('공유 보드를 저장하지 못했습니다')
}

function App() {
  const shareKey = useMemo(() => getShareKey(), [])
  const [pinAccepted, setPinAccepted] = useState(() => {
    if (!shareKey || !requirePin) return true

    try {
      return sessionStorage.getItem(getPinSessionKey(shareKey)) === 'true'
    } catch {
      return false
    }
  })
  const remoteLoadedRef = useRef(!shareKey)
  const [tasks, setTasks] = useState<Task[]>(() =>
    normalizeTasks(readStorage(tasksStorageKey, seedTasks)),
  )
  const [members, setMembers] = useState<string[]>(() =>
    readStorage(membersStorageKey, seedMembers),
  )
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [newMember, setNewMember] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<SyncState>(
    shareKey ? 'loading' : 'local',
  )
  const [formTask, setFormTask] = useState(() =>
    createEmptyTask(members[0] ?? ''),
  )

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'long',
      }).format(new Date()),
    [],
  )

  const teamMembers = useMemo(() => {
    const taskOwners = tasks.map((task) => task.owner).filter(Boolean)
    return Array.from(new Set([...members, ...taskOwners])).sort((a, b) =>
      a.localeCompare(b, 'ko'),
    )
  }, [members, tasks])

  useEffect(() => {
    if (shareKey) return
    localStorage.setItem(tasksStorageKey, JSON.stringify(tasks))
  }, [shareKey, tasks])

  useEffect(() => {
    if (shareKey) return
    localStorage.setItem(membersStorageKey, JSON.stringify(members))
  }, [members, shareKey])

  useEffect(() => {
    if (!shareKey || !pinAccepted) return

    let active = true
    fetchSharedBoard(shareKey, boardPin)
      .then((payload) => {
        if (!active) return
        setTasks(payload.tasks)
        setMembers(payload.members)
        remoteLoadedRef.current = true
        setSyncState('synced')
      })
      .catch(() => {
        if (!active) return
        remoteLoadedRef.current = true
        setSyncState('error')
      })

    return () => {
      active = false
    }
  }, [pinAccepted, shareKey])

  useEffect(() => {
    if (!shareKey || !pinAccepted || !remoteLoadedRef.current) return

    setSyncState('saving')
    const timeoutId = window.setTimeout(() => {
      saveSharedBoard(shareKey, { members, tasks }, boardPin)
        .then(() => setSyncState('synced'))
        .catch(() => setSyncState('error'))
    }, 650)

    return () => window.clearTimeout(timeoutId)
  }, [members, pinAccepted, shareKey, tasks])

  const projects = useMemo(
    () =>
      Array.from(new Set(tasks.map((task) => task.project).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, 'ko'),
      ),
    [tasks],
  )

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          task.title,
          task.project,
          task.owner,
          task.notes,
          task.goal,
          task.checklist.map((item) => item.text).join(' '),
          task.attachments.map((attachment) => attachment.label).join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' || task.status === statusFilter
      const matchesOwner = ownerFilter === 'all' || task.owner === ownerFilter
      const matchesProject =
        projectFilter === 'all' || task.project === projectFilter
      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter
      const daysLeft = getDaysLeft(task.dueDate)
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && daysLeft === 0) ||
        (dateFilter === 'week' && daysLeft >= 0 && daysLeft <= 7) ||
        (dateFilter === 'overdue' && task.status !== 'done' && daysLeft < 0)

      return (
        matchesQuery &&
        matchesStatus &&
        matchesOwner &&
        matchesProject &&
        matchesPriority &&
        matchesDate
      )
    })
  }, [
    dateFilter,
    ownerFilter,
    priorityFilter,
    projectFilter,
    query,
    statusFilter,
    tasks,
  ])

  const stats = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== 'done')
    const dueSoon = openTasks.filter((task) => getDaysLeft(task.dueDate) <= 2)
    const completed = tasks.filter((task) => task.status === 'done')
    const progress = tasks.length
      ? Math.round((completed.length / tasks.length) * 100)
      : 0

    return {
      total: tasks.length,
      open: openTasks.length,
      dueSoon: dueSoon.length,
      progress,
    }
  }, [tasks])

  const tasksByStatus = statusOptions.map((status) => ({
    ...status,
    tasks: filteredTasks.filter((task) => task.status === status.value),
  }))

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null

  const bottlenecks = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== 'done')
    const overdue = activeTasks.filter((task) => getDaysLeft(task.dueDate) < 0)
    const review = tasks.filter((task) => task.status === 'review')
    const urgentHigh = activeTasks.filter(
      (task) => task.priority === 'high' && getDaysLeft(task.dueDate) <= 2,
    )
    const unassigned = tasks.filter((task) => task.owner === '미배정')
    const noProgress = activeTasks.filter(
      (task) =>
        task.checklist.length > 0 &&
        task.checklist.every((item) => !item.done) &&
        getDaysLeft(task.dueDate) <= 7,
    )
    const focusTasks = [...overdue, ...urgentHigh, ...review, ...noProgress]
      .filter(
        (task, index, allTasks) =>
          allTasks.findIndex((candidate) => candidate.id === task.id) === index,
      )
      .sort((a, b) => {
        const dueSort = a.dueDate.localeCompare(b.dueDate)
        return dueSort || a.priority.localeCompare(b.priority)
      })
      .slice(0, 6)

    return { focusTasks, noProgress, overdue, review, urgentHigh, unassigned }
  }, [tasks])

  const personalStats = teamMembers.map((member) => {
    const memberTasks = tasks.filter((task) => task.owner === member)
    const completed = memberTasks.filter((task) => task.status === 'done')
    const urgent = memberTasks.filter(
      (task) => task.status !== 'done' && getDaysLeft(task.dueDate) <= 2,
    )
    const progress = memberTasks.length
      ? Math.round((completed.length / memberTasks.length) * 100)
      : 0

    return {
      member,
      total: memberTasks.length,
      open: memberTasks.length - completed.length,
      urgent: urgent.length,
      progress,
    }
  })

  const projectStats = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project === project)
    const completed = projectTasks.filter((task) => task.status === 'done')
    const overdue = projectTasks.filter(
      (task) => task.status !== 'done' && getDaysLeft(task.dueDate) < 0,
    )
    const high = projectTasks.filter(
      (task) => task.status !== 'done' && task.priority === 'high',
    )
    const progress = projectTasks.length
      ? Math.round((completed.length / projectTasks.length) * 100)
      : 0

    return {
      completed: completed.length,
      high: high.length,
      overdue: overdue.length,
      progress,
      project,
      total: projectTasks.length,
    }
  })

  const workloadStats = teamMembers.map((member) => {
    const memberTasks = tasks.filter((task) => task.owner === member)
    const open = memberTasks.filter((task) => task.status !== 'done')
    const high = open.filter((task) => task.priority === 'high')
    const dueSoon = open.filter((task) => {
      const daysLeft = getDaysLeft(task.dueDate)
      return daysLeft >= 0 && daysLeft <= 7
    })
    const loadScore = open.length + high.length * 2 + dueSoon.length

    return {
      dueSoon: dueSoon.length,
      high: high.length,
      loadScore,
      member,
      open: open.length,
    }
  })

  const recentActivity = useMemo(
    () =>
      tasks
        .flatMap((task) =>
          task.logs.map((log) => ({
            ...log,
            owner: task.owner,
            taskId: task.id,
            taskTitle: task.title,
          })),
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 8),
    [tasks],
  )

  const timelineDays = useMemo(() => {
    const taskDates = Array.from(
      new Set(filteredTasks.map((task) => task.dueDate)),
    ).sort()
    const nextSevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() + index)
      return toDateInputValue(date)
    })

    return Array.from(new Set([...nextSevenDays, ...taskDates])).sort()
  }, [filteredTasks])

  const graphDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const taskDates = filteredTasks
      .flatMap((task) => [task.startDate, task.dueDate])
      .map((dateValue) => new Date(`${dateValue}T00:00:00`))
      .filter((date) => !Number.isNaN(date.getTime()))
    const earliestDate = taskDates.reduce(
      (earliest, date) => (date < earliest ? date : earliest),
      today,
    )
    const latestDate = taskDates.reduce(
      (latest, date) => (date > latest ? date : latest),
      addDays(today, 13),
    )
    const firstDate = earliestDate < today ? earliestDate : today
    const dayCount = Math.max(
      14,
      Math.min(
        31,
        diffDays(toDateInputValue(firstDate), toDateInputValue(latestDate)) + 1,
      ),
    )

    return Array.from({ length: dayCount }, (_, index) =>
      toDateInputValue(addDays(firstDate, index)),
    )
  }, [filteredTasks])

  const visibleGraphMembers = useMemo(
    () => (ownerFilter === 'all' ? teamMembers : [ownerFilter]),
    [ownerFilter, teamMembers],
  )

  const navItems: Array<{
    icon: typeof LayoutDashboard
    label: string
    value: View
  }> = [
    { icon: LayoutDashboard, label: '대시보드', value: 'dashboard' },
    { icon: CircleDot, label: '작업 목록', value: 'tasks' },
    { icon: CalendarDays, label: '달력', value: 'calendar' },
    { icon: Users, label: '팀 현황', value: 'people' },
  ]

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formTask.title.trim() || !formTask.owner.trim()) return

    setTasks((currentTasks) => [
      {
        ...formTask,
        checklist: [
          {
            done: false,
            id: crypto.randomUUID(),
            text: '첫 진행 항목 정리',
          },
        ],
        id: crypto.randomUUID(),
        logs: [
          {
            id: crypto.randomUUID(),
            text: '작업 생성',
            timestamp: toDateInputValue(new Date()),
          },
        ],
        title: formTask.title.trim(),
        owner: formTask.owner.trim(),
        startDate:
          formTask.startDate <= formTask.dueDate
            ? formTask.startDate
            : formTask.dueDate,
        notes: formTask.notes.trim(),
      },
      ...currentTasks,
    ])
    setFormTask(createEmptyTask(formTask.owner))
    setActiveView('tasks')
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedMember = newMember.trim()

    if (!trimmedMember || teamMembers.includes(trimmedMember)) return

    setMembers((currentMembers) => [...currentMembers, trimmedMember])
    setFormTask((task) => ({ ...task, owner: trimmedMember }))
    setOwnerFilter(trimmedMember)
    setNewMember('')
    setActiveView('people')
  }

  function deleteMember(member: string) {
    setMembers((currentMembers) =>
      currentMembers.filter((currentMember) => currentMember !== member),
    )
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.owner === member ? { ...task, owner: '미배정' } : task,
      ),
    )
    if (ownerFilter === member) setOwnerFilter('all')
    if (formTask.owner === member) {
      const nextMember =
        teamMembers.find((currentMember) => currentMember !== member) ?? ''
      setFormTask((task) => ({ ...task, owner: nextMember }))
    }
  }

  function updateTaskStatus(id: string, status: Status) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id || task.status === status) return task

        const fromLabel =
          statusOptions.find((option) => option.value === task.status)?.label ??
          task.status
        const toLabel =
          statusOptions.find((option) => option.value === status)?.label ?? status

        return {
          ...task,
          logs: [
            {
              id: crypto.randomUUID(),
              text: `상태 변경: ${fromLabel} -> ${toLabel}`,
              timestamp: toDateInputValue(new Date()),
            },
            ...task.logs,
          ],
          status,
        }
      }),
    )
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task,
      ),
    )
  }

  function deleteTask(id: string) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id))
    if (selectedTaskId === id) setSelectedTaskId(null)
  }

  function exportFilteredTasks() {
    const headers = [
      '작업명',
      '프로젝트',
      '담당자',
      '상태',
      '우선순위',
      '시작일',
      '마감일',
      '체크리스트',
      '첨부 링크',
      '목표',
      '메모',
    ]
    const rows = filteredTasks.map((task) => {
      const completedChecklist = task.checklist.filter((item) => item.done).length
      return [
        task.title,
        task.project,
        task.owner,
        statusOptions.find((status) => status.value === task.status)?.label ??
          task.status,
        priorityOptions.find((priority) => priority.value === task.priority)
          ?.label ?? task.priority,
        task.startDate,
        task.dueDate,
        `${completedChecklist}/${task.checklist.length}`,
        task.attachments.map((attachment) => attachment.url).join(' '),
        task.goal,
        task.notes,
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `xconda-tasks-${toDateInputValue(new Date())}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (requireShareKey && !shareKey) {
    return <AccessRequired />
  }

  if (shareKey && requirePin && !pinAccepted) {
    return (
      <PinGate
        onUnlock={() => {
          try {
            sessionStorage.setItem(getPinSessionKey(shareKey), 'true')
          } catch {
            // Session storage can be unavailable in some private browsing modes.
          }
          setPinAccepted(true)
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ListChecks size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">xconda</p>
            <h1>xconda 업무 보드</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="앱 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={
                  activeView === item.value ? 'nav-item active' : 'nav-item'
                }
                key={item.value}
                onClick={() => setActiveView(item.value)}
                type="button"
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <section className="team-panel">
          <div className="panel-heading">
            <Users size={18} aria-hidden="true" />
            <h2>팀원</h2>
          </div>
          <form className="member-form" onSubmit={addMember}>
            <input
              aria-label="새 팀원 이름"
              onChange={(event) => setNewMember(event.target.value)}
              placeholder="팀원 이름"
              value={newMember}
            />
            <button aria-label="팀원 추가" title="팀원 추가" type="submit">
              <UserPlus size={17} aria-hidden="true" />
            </button>
          </form>
          <div className="member-list">
            <button
              className={ownerFilter === 'all' ? 'member active' : 'member'}
              onClick={() => setOwnerFilter('all')}
              type="button"
            >
              <span>전</span>
              전체
            </button>
            {teamMembers.map((member) => (
              <div className="member-row" key={member}>
                <button
                  className={ownerFilter === member ? 'member active' : 'member'}
                  onClick={() => setOwnerFilter(member)}
                  type="button"
                >
                  <span>{member.slice(0, 1)}</span>
                  {member}
                </button>
                <button
                  aria-label={`${member} 삭제`}
                  className="member-delete"
                  onClick={() => deleteMember(member)}
                  title="팀원 삭제"
                  type="button"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{todayLabel} 기준</p>
            <h2>xconda 업무를 배정하고 진행 상황을 추적하세요</h2>
            <SyncIndicator shareKey={shareKey} syncState={syncState} />
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="작업, 프로젝트, 담당자 검색"
                type="search"
                value={query}
              />
            </label>
            <label className="select-box">
              <Filter size={18} aria-hidden="true" />
              <select
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | Status)
                }
                value={statusFilter}
              >
                <option value="all">전체 상태</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </div>
        </header>

        <FilterPanel
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onExport={exportFilteredTasks}
          onPriorityFilterChange={setPriorityFilter}
          onProjectFilterChange={setProjectFilter}
          priorityFilter={priorityFilter}
          projectFilter={projectFilter}
          projects={projects}
          resultCount={filteredTasks.length}
        />

        {activeView === 'dashboard' && (
          <>
            <Metrics stats={stats} />
            <BottleneckPanel
              bottlenecks={bottlenecks}
              onSelectTask={setSelectedTaskId}
            />
            <ProjectOverview projectStats={projectStats} />
            <WorkloadOverview workloadStats={workloadStats} />
            <TaskComposer
              formTask={formTask}
              onChange={setFormTask}
              onSubmit={addTask}
              teamMembers={teamMembers}
            />
            <FocusList
              onSelectTask={setSelectedTaskId}
              tasks={bottlenecks.focusTasks}
            />
            <RecentActivity
              activities={recentActivity}
              onSelectTask={setSelectedTaskId}
            />
            <PeopleOverview personalStats={personalStats} />
            <LinearScheduleGraph
              graphDays={graphDays}
              members={visibleGraphMembers}
              tasks={filteredTasks}
            />
            <Timeline tasks={filteredTasks} timelineDays={timelineDays} />
          </>
        )}

        {activeView === 'tasks' && (
          <>
            <TaskComposer
              formTask={formTask}
              onChange={setFormTask}
              onSubmit={addTask}
              teamMembers={teamMembers}
            />
            <Board
              onDeleteTask={deleteTask}
              onSelectTask={setSelectedTaskId}
              onUpdateStatus={updateTaskStatus}
              selectedTaskId={selectedTaskId}
              tasksByStatus={tasksByStatus}
            />
          </>
        )}

        {activeView === 'calendar' && (
          <>
            <Metrics stats={stats} />
            <LinearScheduleGraph
              graphDays={graphDays}
              members={visibleGraphMembers}
              tasks={filteredTasks}
            />
            <Timeline tasks={filteredTasks} timelineDays={timelineDays} />
          </>
        )}

        {activeView === 'people' && (
          <>
            <section className="team-manager" aria-label="팀원 관리">
              <div>
                <p className="eyebrow">Members</p>
                <h3>팀원 추가와 삭제</h3>
              </div>
              <form className="member-form wide" onSubmit={addMember}>
                <input
                  aria-label="새 팀원 이름"
                  onChange={(event) => setNewMember(event.target.value)}
                  placeholder="예: 지훈"
                  value={newMember}
                />
                <button className="primary-action" type="submit">
                  <UserPlus size={18} aria-hidden="true" />
                  팀원 추가
                </button>
              </form>
            </section>
            <PeopleOverview personalStats={personalStats} />
            <WorkloadOverview workloadStats={workloadStats} />
          </>
        )}
      </section>

      {selectedTask && (
        <TaskDetailPanel
          onClose={() => setSelectedTaskId(null)}
          onUpdateTask={updateTask}
          task={selectedTask}
          teamMembers={teamMembers}
        />
      )}
    </main>
  )
}

function AccessRequired() {
  return (
    <main className="access-required">
      <section>
        <div className="brand-mark">
          <ListChecks size={24} aria-hidden="true" />
        </div>
        <p className="eyebrow">Private Board</p>
        <h1>공유 링크가 필요합니다</h1>
        <p>
          이 업무 보드는 초대 링크에 포함된 보드 키가 있어야 열립니다.
          받은 주소 전체를 다시 확인해 주세요.
        </p>
      </section>
    </main>
  )
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pin.trim() !== boardPin) {
      setError('PIN 번호가 맞지 않습니다')
      setPin('')
      return
    }

    onUnlock()
  }

  return (
    <main className="pin-gate">
      <form onSubmit={submitPin}>
        <div className="brand-mark">
          <ListChecks size={24} aria-hidden="true" />
        </div>
        <p className="eyebrow">Private Board</p>
        <h1>xconda 업무 보드</h1>
        <p>공유 링크와 PIN을 가진 팀원만 보드를 열 수 있습니다.</p>
        <label>
          PIN 번호
          <input
            autoFocus
            inputMode="numeric"
            onChange={(event) => {
              setPin(event.target.value)
              setError('')
            }}
            placeholder="PIN 입력"
            type="password"
            value={pin}
          />
        </label>
        {error && <strong className="pin-error">{error}</strong>}
        <button className="primary-action" type="submit">
          보드 열기
        </button>
      </form>
    </main>
  )
}

function Metrics({
  stats,
}: {
  stats: { dueSoon: number; open: number; progress: number; total: number }
}) {
  return (
    <section className="metrics" aria-label="업무 요약">
      <article>
        <Clock3 size={20} aria-hidden="true" />
        <span>열린 작업</span>
        <strong>{stats.open}</strong>
      </article>
      <article>
        <CalendarClock size={20} aria-hidden="true" />
        <span>마감 임박</span>
        <strong>{stats.dueSoon}</strong>
      </article>
      <article>
        <CheckCircle2 size={20} aria-hidden="true" />
        <span>완료율</span>
        <strong>{stats.progress}%</strong>
      </article>
      <article>
        <Users size={20} aria-hidden="true" />
        <span>전체 작업</span>
        <strong>{stats.total}</strong>
      </article>
    </section>
  )
}

function SyncIndicator({
  shareKey,
  syncState,
}: {
  shareKey: string
  syncState: SyncState
}) {
  const labelByState: Record<SyncState, string> = {
    error: '공유 저장 오류',
    loading: '공유 보드 불러오는 중',
    local: '로컬 저장',
    saving: '공유 저장 중',
    synced: '공유 저장됨',
  }

  return (
    <div className={`sync-indicator ${syncState}`}>
      <Globe2 size={15} aria-hidden="true" />
      <span>{labelByState[syncState]}</span>
      {shareKey && <strong>key {shareKey.slice(0, 6)}...</strong>}
    </div>
  )
}

function FilterPanel({
  dateFilter,
  onDateFilterChange,
  onExport,
  onPriorityFilterChange,
  onProjectFilterChange,
  priorityFilter,
  projectFilter,
  projects,
  resultCount,
}: {
  dateFilter: DateFilter
  onDateFilterChange: (filter: DateFilter) => void
  onExport: () => void
  onPriorityFilterChange: (filter: 'all' | Priority) => void
  onProjectFilterChange: (filter: string) => void
  priorityFilter: 'all' | Priority
  projectFilter: string
  projects: string[]
  resultCount: number
}) {
  return (
    <section className="filter-panel" aria-label="상세 필터">
      <div className="filter-title">
        <SlidersHorizontal size={18} aria-hidden="true" />
        <span>상세 필터</span>
        <strong>{resultCount}개 표시</strong>
      </div>
      <div className="filter-controls">
        <label>
          프로젝트
          <select
            onChange={(event) => onProjectFilterChange(event.target.value)}
            value={projectFilter}
          >
            <option value="all">전체 프로젝트</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </label>
        <label>
          우선순위
          <select
            onChange={(event) =>
              onPriorityFilterChange(event.target.value as 'all' | Priority)
            }
            value={priorityFilter}
          >
            <option value="all">전체 우선순위</option>
            {priorityOptions.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          기간
          <select
            onChange={(event) =>
              onDateFilterChange(event.target.value as DateFilter)
            }
            value={dateFilter}
          >
            {dateFilterOptions.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="export-button" onClick={onExport} type="button">
        <Download size={17} aria-hidden="true" />
        CSV
      </button>
    </section>
  )
}

function BottleneckPanel({
  bottlenecks,
  onSelectTask,
}: {
  bottlenecks: {
    focusTasks: Task[]
    noProgress: Task[]
    overdue: Task[]
    review: Task[]
    urgentHigh: Task[]
    unassigned: Task[]
  }
  onSelectTask: (id: string) => void
}) {
  const bottleneckCards = [
    {
      accent: 'danger',
      count: bottlenecks.overdue.length,
      label: '지연',
      note: '마감일이 지난 열린 작업',
    },
    {
      accent: 'warning',
      count: bottlenecks.urgentHigh.length,
      label: '긴급',
      note: '2일 이내 고우선순위',
    },
    {
      accent: 'review',
      count: bottlenecks.review.length,
      label: '검토 대기',
      note: '검토 상태 작업',
    },
    {
      accent: 'muted',
      count: bottlenecks.noProgress.length,
      label: '무진행',
      note: '체크리스트 미완료',
    },
  ]

  return (
    <section className="bottleneck-panel" aria-label="병목 요약">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Risk</p>
          <h3>병목 요약</h3>
        </div>
        <Flag size={20} aria-hidden="true" />
      </div>
      <div className="bottleneck-grid">
        {bottleneckCards.map((card) => (
          <article className={`bottleneck-card ${card.accent}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.count}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </div>
      {bottlenecks.unassigned.length > 0 && (
        <button
          className="unassigned-alert"
          onClick={() => onSelectTask(bottlenecks.unassigned[0].id)}
          type="button"
        >
          미배정 작업 {bottlenecks.unassigned.length}개가 있습니다
        </button>
      )}
    </section>
  )
}

function ProjectOverview({
  projectStats,
}: {
  projectStats: Array<{
    completed: number
    high: number
    overdue: number
    progress: number
    project: string
    total: number
  }>
}) {
  return (
    <section className="project-overview" aria-label="프로젝트별 현황">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Projects</p>
          <h3>프로젝트별 현황</h3>
        </div>
        <PieChart size={20} aria-hidden="true" />
      </div>
      <div className="project-grid">
        {projectStats.map((project) => (
          <article className="project-card" key={project.project}>
            <div className="project-head">
              <h4>{project.project}</h4>
              <strong>{project.progress}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${project.progress}%` }} />
            </div>
            <div className="project-meta">
              <span>전체 {project.total}</span>
              <span>완료 {project.completed}</span>
              <span>고우선 {project.high}</span>
              <span>지연 {project.overdue}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function WorkloadOverview({
  workloadStats,
}: {
  workloadStats: Array<{
    dueSoon: number
    high: number
    loadScore: number
    member: string
    open: number
  }>
}) {
  const maxScore = Math.max(...workloadStats.map((person) => person.loadScore), 1)

  return (
    <section className="workload-overview" aria-label="담당자별 업무 부하">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workload</p>
          <h3>담당자별 업무 부하</h3>
        </div>
        <Users size={20} aria-hidden="true" />
      </div>
      <div className="workload-list">
        {workloadStats.map((person) => {
          const loadPercent = Math.round((person.loadScore / maxScore) * 100)
          return (
            <article className="workload-row" key={person.member}>
              <div className="workload-person">
                <span>{person.member.slice(0, 1)}</span>
                <strong>{person.member}</strong>
              </div>
              <div className="workload-meter">
                <div aria-hidden="true">
                  <i style={{ width: `${loadPercent}%` }} />
                </div>
                <small>
                  열린 {person.open} · 고우선 {person.high} · 7일 내{' '}
                  {person.dueSoon}
                </small>
              </div>
              <strong className="load-score">{person.loadScore}</strong>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function RecentActivity({
  activities,
  onSelectTask,
}: {
  activities: Array<ActivityLog & { owner: string; taskId: string; taskTitle: string }>
  onSelectTask: (id: string) => void
}) {
  return (
    <section className="recent-activity" aria-label="최근 활동">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Activity</p>
          <h3>최근 활동</h3>
        </div>
        <History size={20} aria-hidden="true" />
      </div>
      <div className="activity-list">
        {activities.map((activity) => (
          <button
            className="activity-item"
            key={activity.id}
            onClick={() => onSelectTask(activity.taskId)}
            type="button"
          >
            <time>{activity.timestamp}</time>
            <strong>{activity.taskTitle}</strong>
            <span>
              {activity.owner} · {activity.text}
            </span>
          </button>
        ))}
        {activities.length === 0 && (
          <div className="empty-focus">최근 활동이 없습니다</div>
        )}
      </div>
    </section>
  )
}

function FocusList({
  onSelectTask,
  tasks,
}: {
  onSelectTask: (id: string) => void
  tasks: Task[]
}) {
  return (
    <section className="focus-list" aria-label="우선 확인 작업">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Focus</p>
          <h3>우선 확인 작업</h3>
        </div>
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <div className="focus-items">
        {tasks.map((task) => (
          <button
            className="focus-item"
            key={task.id}
            onClick={() => onSelectTask(task.id)}
            type="button"
          >
            <span className={`priority ${task.priority}`}>
              {
                priorityOptions.find(
                  (priority) => priority.value === task.priority,
                )?.label
              }
            </span>
            <strong>{task.title}</strong>
            <small>
              {task.owner} · {task.project} · {formatDue(task.dueDate)}
            </small>
          </button>
        ))}
        {tasks.length === 0 && (
          <div className="empty-focus">우선 확인할 병목 작업이 없습니다</div>
        )}
      </div>
    </section>
  )
}

function TaskComposer({
  formTask,
  onChange,
  onSubmit,
  teamMembers,
}: {
  formTask: Omit<Task, 'id'>
  onChange: (task: Omit<Task, 'id'>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  teamMembers: string[]
}) {
  return (
    <section className="task-composer" aria-label="새 작업 추가">
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            작업명
            <input
              onChange={(event) =>
                onChange({ ...formTask, title: event.target.value })
              }
              placeholder="예: 제안서 초안 작성"
              required
              value={formTask.title}
            />
          </label>
          <label>
            담당자
            <select
              onChange={(event) =>
                onChange({ ...formTask, owner: event.target.value })
              }
              required
              value={formTask.owner}
            >
              <option value="">선택</option>
              {teamMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </label>
          <label>
            프로젝트
            <input
              list="project-presets"
              onChange={(event) =>
                onChange({ ...formTask, project: event.target.value })
              }
              placeholder="일반 업무, 개발, 영상제작"
              value={formTask.project}
            />
            <datalist id="project-presets">
              {projectPresets.map((project) => (
                <option key={project} value={project} />
              ))}
            </datalist>
          </label>
          <label>
            시작일
            <input
              onChange={(event) =>
                onChange({ ...formTask, startDate: event.target.value })
              }
              type="date"
              value={formTask.startDate}
            />
          </label>
          <label>
            마감일
            <input
              onChange={(event) =>
                onChange({ ...formTask, dueDate: event.target.value })
              }
              type="date"
              value={formTask.dueDate}
            />
          </label>
          <label>
            우선순위
            <select
              onChange={(event) =>
                onChange({
                  ...formTask,
                  priority: event.target.value as Priority,
                })
              }
              value={formTask.priority}
            >
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
          <label className="notes-field">
            목표
            <input
              onChange={(event) =>
                onChange({ ...formTask, goal: event.target.value })
              }
              placeholder="이 작업으로 달성할 결과"
              value={formTask.goal}
            />
          </label>
          <label className="notes-field">
            메모
            <input
              onChange={(event) =>
                onChange({ ...formTask, notes: event.target.value })
              }
              placeholder="공유할 맥락을 짧게 적기"
              value={formTask.notes}
            />
          </label>
        </div>
        <button className="primary-action" type="submit">
          <Plus size={18} aria-hidden="true" />
          작업 추가
        </button>
      </form>
    </section>
  )
}

function Board({
  onDeleteTask,
  onSelectTask,
  onUpdateStatus,
  selectedTaskId,
  tasksByStatus,
}: {
  onDeleteTask: (id: string) => void
  onSelectTask: (id: string) => void
  onUpdateStatus: (id: string, status: Status) => void
  selectedTaskId: string | null
  tasksByStatus: Array<{ label: string; tasks: Task[]; value: Status }>
}) {
  return (
    <section className="board" aria-label="상태별 작업 보드">
      {tasksByStatus.map((column) => (
        <article className="column" key={column.value}>
          <div className="column-header">
            <h3>{column.label}</h3>
            <span>{column.tasks.length}</span>
          </div>

          <div className="task-list">
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                onDeleteTask={onDeleteTask}
                onSelectTask={onSelectTask}
                onUpdateStatus={onUpdateStatus}
                selected={selectedTaskId === task.id}
                task={task}
              />
            ))}

            {column.tasks.length === 0 && (
              <div className="empty-column">표시할 작업이 없습니다</div>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}

function TaskCard({
  onDeleteTask,
  onSelectTask,
  onUpdateStatus,
  selected,
  task,
}: {
  onDeleteTask: (id: string) => void
  onSelectTask: (id: string) => void
  onUpdateStatus: (id: string, status: Status) => void
  selected: boolean
  task: Task
}) {
  const isUrgent = task.status !== 'done' && getDaysLeft(task.dueDate) <= 2
  const completedChecklist = task.checklist.filter((item) => item.done).length
  const checklistLabel = task.checklist.length
    ? `${completedChecklist}/${task.checklist.length} 완료`
    : '체크리스트 없음'

  return (
    <article className={selected ? 'task-card selected' : 'task-card'}>
      <div className="task-card-top">
        <span className={`priority ${task.priority}`}>
          {
            priorityOptions.find((priority) => priority.value === task.priority)
              ?.label
          }
        </span>
        <button
          aria-label={`${task.title} 삭제`}
          className="icon-button"
          onClick={() => onDeleteTask(task.id)}
          title="삭제"
          type="button"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      <button
        className="task-open"
        onClick={() => onSelectTask(task.id)}
        type="button"
      >
        <h4>{task.title}</h4>
        <SquarePen size={16} aria-hidden="true" />
      </button>
      <p>{task.notes || '메모 없음'}</p>
      <div className="task-meta">
        <span>{task.project}</span>
        <span>{task.owner}</span>
      </div>
      <div className="task-progress">
        <span>{checklistLabel}</span>
        <div aria-hidden="true">
          <i
            style={{
              width: task.checklist.length
                ? `${(completedChecklist / task.checklist.length) * 100}%`
                : '0%',
            }}
          />
        </div>
      </div>
      <div className={isUrgent ? 'due urgent' : 'due'}>
        {isUrgent && <AlertTriangle size={15} />}
        <span>{task.startDate} 시작</span>
        <span>{formatDue(task.dueDate)}</span>
        <time dateTime={task.dueDate}>{task.dueDate}</time>
      </div>
      <label className="status-control">
        상태
        <select
          onChange={(event) =>
            onUpdateStatus(task.id, event.target.value as Status)
          }
          value={task.status}
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}

function PeopleOverview({
  personalStats,
}: {
  personalStats: Array<{
    member: string
    open: number
    progress: number
    total: number
    urgent: number
  }>
}) {
  return (
    <section className="people-overview" aria-label="개인별 업무 현황">
      <div className="section-heading">
        <div>
          <p className="eyebrow">People</p>
          <h3>개인 태스크 상황</h3>
        </div>
        <BarChart3 size={20} aria-hidden="true" />
      </div>
      <div className="people-grid">
        {personalStats.map((person) => (
          <article className="person-card" key={person.member}>
            <div className="person-head">
              <span>{person.member.slice(0, 1)}</span>
              <div>
                <h4>{person.member}</h4>
                <p>열린 작업 {person.open}개</p>
              </div>
            </div>
            <div className="person-stats">
              <span>전체 {person.total}</span>
              <span>임박 {person.urgent}</span>
              <span>완료 {person.progress}%</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${person.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TaskDetailPanel({
  onClose,
  onUpdateTask,
  task,
  teamMembers,
}: {
  onClose: () => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  task: Task
  teamMembers: string[]
}) {
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [newLog, setNewLog] = useState('')
  const [newAttachmentLabel, setNewAttachmentLabel] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')
  const completedChecklist = task.checklist.filter((item) => item.done).length
  const checklistProgress = task.checklist.length
    ? Math.round((completedChecklist / task.checklist.length) * 100)
    : 0

  function addChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = newChecklistItem.trim()
    if (!text) return

    onUpdateTask(task.id, {
      checklist: [
        ...task.checklist,
        { done: false, id: crypto.randomUUID(), text },
      ],
    })
    setNewChecklistItem('')
  }

  function toggleChecklistItem(itemId: string) {
    onUpdateTask(task.id, {
      checklist: task.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    })
  }

  function deleteChecklistItem(itemId: string) {
    onUpdateTask(task.id, {
      checklist: task.checklist.filter((item) => item.id !== itemId),
    })
  }

  function addLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = newLog.trim()
    if (!text) return

    onUpdateTask(task.id, {
      logs: [
        {
          id: crypto.randomUUID(),
          text,
          timestamp: toDateInputValue(new Date()),
        },
        ...task.logs,
      ],
    })
    setNewLog('')
  }

  function updateStatus(status: Status) {
    if (task.status === status) return

    const fromLabel =
      statusOptions.find((option) => option.value === task.status)?.label ??
      task.status
    const toLabel =
      statusOptions.find((option) => option.value === status)?.label ?? status

    onUpdateTask(task.id, {
      logs: [
        {
          id: crypto.randomUUID(),
          text: `상태 변경: ${fromLabel} -> ${toLabel}`,
          timestamp: toDateInputValue(new Date()),
        },
        ...task.logs,
      ],
      status,
    })
  }

  function addAttachment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const label = newAttachmentLabel.trim()
    const url = newAttachmentUrl.trim()

    if (!label || !url) return

    onUpdateTask(task.id, {
      attachments: [
        ...task.attachments,
        { id: crypto.randomUUID(), label, url },
      ],
    })
    setNewAttachmentLabel('')
    setNewAttachmentUrl('')
  }

  function deleteAttachment(attachmentId: string) {
    onUpdateTask(task.id, {
      attachments: task.attachments.filter(
        (attachment) => attachment.id !== attachmentId,
      ),
    })
  }

  return (
    <aside className="detail-panel" aria-label="작업 상세">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Task Detail</p>
          <h3>{task.title}</h3>
        </div>
        <button
          aria-label="상세 패널 닫기"
          className="icon-button"
          onClick={onClose}
          title="닫기"
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="detail-summary">
        <span>{task.owner}</span>
        <span>{task.project}</span>
        <span>{checklistProgress}% 진행</span>
      </div>

      <div className="detail-grid">
        <label>
          작업명
          <input
            onChange={(event) =>
              onUpdateTask(task.id, { title: event.target.value })
            }
            value={task.title}
          />
        </label>
        <label>
          담당자
          <select
            onChange={(event) =>
              onUpdateTask(task.id, { owner: event.target.value })
            }
            value={task.owner}
          >
            {teamMembers.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </label>
        <label>
          시작일
          <input
            onChange={(event) =>
              onUpdateTask(task.id, { startDate: event.target.value })
            }
            type="date"
            value={task.startDate}
          />
        </label>
        <label>
          마감일
          <input
            onChange={(event) =>
              onUpdateTask(task.id, { dueDate: event.target.value })
            }
            type="date"
            value={task.dueDate}
          />
        </label>
        <label>
          상태
          <select
            onChange={(event) => updateStatus(event.target.value as Status)}
            value={task.status}
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          우선순위
          <select
            onChange={(event) =>
              onUpdateTask(task.id, {
                priority: event.target.value as Priority,
              })
            }
            value={task.priority}
          >
            {priorityOptions.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="detail-textarea">
        목표
        <textarea
          onChange={(event) => onUpdateTask(task.id, { goal: event.target.value })}
          placeholder="이 작업으로 달성해야 할 결과"
          value={task.goal}
        />
      </label>

      <label className="detail-textarea">
        메모
        <textarea
          onChange={(event) =>
            onUpdateTask(task.id, { notes: event.target.value })
          }
          placeholder="공유할 맥락"
          value={task.notes}
        />
      </label>

      <section className="detail-section">
        <div className="detail-section-head">
          <h4>체크리스트</h4>
          <span>
            {completedChecklist}/{task.checklist.length}
          </span>
        </div>
        <div className="checklist">
          {task.checklist.map((item) => (
            <label className="checklist-item" key={item.id}>
              <input
                checked={item.done}
                onChange={() => toggleChecklistItem(item.id)}
                type="checkbox"
              />
              <span>{item.text}</span>
              <button
                aria-label={`${item.text} 삭제`}
                onClick={() => deleteChecklistItem(item.id)}
                type="button"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </label>
          ))}
        </div>
        <form className="inline-form" onSubmit={addChecklistItem}>
          <input
            onChange={(event) => setNewChecklistItem(event.target.value)}
            placeholder="세부 작업 추가"
            value={newChecklistItem}
          />
          <button type="submit">
            <Plus size={16} aria-hidden="true" />
          </button>
        </form>
      </section>

      <section className="detail-section">
        <div className="detail-section-head">
          <h4>첨부 링크</h4>
          <span>{task.attachments.length}</span>
        </div>
        <div className="attachment-list">
          {task.attachments.map((attachment) => (
            <div className="attachment-item" key={attachment.id}>
              <a href={attachment.url} rel="noreferrer" target="_blank">
                <Link2 size={14} aria-hidden="true" />
                {attachment.label}
              </a>
              <button
                aria-label={`${attachment.label} 삭제`}
                onClick={() => deleteAttachment(attachment.id)}
                type="button"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
          {task.attachments.length === 0 && (
            <p className="empty-log">첨부 링크 없음</p>
          )}
        </div>
        <form className="attachment-form" onSubmit={addAttachment}>
          <input
            onChange={(event) => setNewAttachmentLabel(event.target.value)}
            placeholder="링크 이름"
            value={newAttachmentLabel}
          />
          <input
            onChange={(event) => setNewAttachmentUrl(event.target.value)}
            placeholder="https://..."
            type="url"
            value={newAttachmentUrl}
          />
          <button type="submit">
            <Plus size={16} aria-hidden="true" />
          </button>
        </form>
      </section>

      <section className="detail-section">
        <div className="detail-section-head">
          <h4>진행 로그</h4>
          <span>{task.logs.length}</span>
        </div>
        <form className="inline-form" onSubmit={addLog}>
          <input
            onChange={(event) => setNewLog(event.target.value)}
            placeholder="진행 상황 기록"
            value={newLog}
          />
          <button type="submit">
            <Plus size={16} aria-hidden="true" />
          </button>
        </form>
        <div className="log-list">
          {task.logs.map((log) => (
            <article key={log.id}>
              <time>{log.timestamp}</time>
              <p>{log.text}</p>
            </article>
          ))}
          {task.logs.length === 0 && <p className="empty-log">기록 없음</p>}
        </div>
      </section>
    </aside>
  )
}

function Timeline({
  tasks,
  timelineDays,
}: {
  tasks: Task[]
  timelineDays: string[]
}) {
  return (
    <section className="timeline-section" aria-label="카드형 달력">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Calendar</p>
          <h3>마감일 카드형 달력</h3>
        </div>
        <CalendarDays size={20} aria-hidden="true" />
      </div>
      <div className="timeline">
        {timelineDays.map((day) => {
          const dayTasks = tasks
            .filter((task) => task.dueDate === day)
            .sort((a, b) => a.title.localeCompare(b.title, 'ko'))

          return (
            <article className="timeline-day" key={day}>
              <div className="timeline-date">
                <strong>{formatCalendarDate(day)}</strong>
                <span>{formatDue(day)}</span>
              </div>
              <div className="timeline-items">
                {dayTasks.map((task) => (
                  <div className={`timeline-task ${task.priority}`} key={task.id}>
                    <span>{task.title}</span>
                    <small>
                      {task.owner} ·{' '}
                      {
                        statusOptions.find(
                          (status) => status.value === task.status,
                        )?.label
                      }
                    </small>
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="timeline-empty">마감 작업 없음</div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function LinearScheduleGraph({
  graphDays,
  members,
  tasks,
}: {
  graphDays: string[]
  members: string[]
  tasks: Task[]
}) {
  const firstDay = graphDays[0]
  const lastDay = graphDays[graphDays.length - 1]
  const visibleMembers = members.length ? members : ['미배정']

  return (
    <section className="schedule-graph-section" aria-label="인원별 선형 그래프 달력">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Schedule Graph</p>
          <h3>인원별 작업 선형 그래프</h3>
        </div>
        <CalendarClock size={20} aria-hidden="true" />
      </div>
      <div className="schedule-range">
        <strong>
          {formatCalendarDate(firstDay)} - {formatCalendarDate(lastDay)}
        </strong>
        <span>상단 날짜 축 기준으로 담당자별 작업이 배치됩니다</span>
      </div>
      <div className="schedule-scroll">
        <div
          className="schedule-grid"
          style={{
            gridTemplateColumns: `132px repeat(${graphDays.length}, minmax(82px, 1fr))`,
          }}
        >
          <div className="schedule-corner">담당자</div>
          {graphDays.map((day) => (
            <div className="schedule-date" key={day}>
              <strong>{formatAxisDate(day)}</strong>
              <span>{formatDue(day)}</span>
            </div>
          ))}

          {visibleMembers.map((member) => {
            const memberTasks = tasks.filter((task) => task.owner === member)

            return (
              <div className="schedule-row" key={member}>
                <div className="schedule-person">
                  <span>{member.slice(0, 1)}</span>
                  {member}
                </div>
                <div
                  className="schedule-track"
                  style={{ gridColumn: `2 / ${graphDays.length + 2}` }}
                >
                  {graphDays.map((day) => (
                    <span className="schedule-cell" key={day} />
                  ))}
                  {memberTasks.map((task, taskIndex) => {
                    const startOffset = diffDays(firstDay, task.startDate)
                    const dueOffset = diffDays(firstDay, task.dueDate)
                    const clampedStartOffset = Math.max(
                      0,
                      Math.min(graphDays.length - 1, startOffset),
                    )
                    const clampedDueOffset = Math.max(
                      0,
                      Math.min(graphDays.length - 1, dueOffset),
                    )
                    const barStartOffset = Math.min(
                      clampedStartOffset,
                      clampedDueOffset,
                    )
                    const rowOffset = taskIndex % 3

                    return (
                      <div
                        className={`schedule-bar ${task.priority} ${task.status}`}
                        key={task.id}
                        style={{
                          gridColumn: `${barStartOffset + 1} / ${clampedDueOffset + 2}`,
                          marginTop: `${rowOffset * 30}px`,
                        }}
                        title={`${task.title} · ${task.owner} · ${task.dueDate}`}
                      >
                        <strong>{task.title}</strong>
                        <span>{formatDue(task.dueDate)}</span>
                      </div>
                    )
                  })}
                  {memberTasks.length === 0 && (
                    <div className="schedule-empty">작업 없음</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default App
