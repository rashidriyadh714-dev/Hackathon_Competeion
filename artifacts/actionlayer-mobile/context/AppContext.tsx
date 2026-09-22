import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type TaskStatus =
  | 'ready'
  | 'in_progress'
  | 'blocked'
  | 'submitted_for_review'
  | 'partially_verified'
  | 'verified'
  | 'completed_by_user'
  | 'needs_correction';

export type ClaimStatus =
  | 'confirmed_from_source'
  | 'supplied_by_user'
  | 'inferred_needs_review'
  | 'conflicting'
  | 'missing';

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  deadline?: string;
  estimatedMinutes: number;
  dependencyIds: string[];
  completionCondition: string;
  evidenceRequired: boolean;
  evidenceId?: string;
  sourceClaimId?: string;
};

export type Claim = {
  id: string;
  field: string;
  value: string;
  status: ClaimStatus;
  confidence: number;
  sourceExcerpt: string;
  sourcePage?: number;
  reviewed: boolean;
};

export type Verification = {
  id: string;
  status: 'partially_verified' | 'verified' | 'needs_correction';
  level: 1 | 2 | 3 | 4 | 5;
  method: string;
  requirementsMet: string[];
  requirementsMissing: string[];
  confidence?: number;
  limitations: string[];
  createdAt: string;
};

export type Evidence = {
  id: string;
  taskId: string;
  type: 'image' | 'pdf' | 'text' | 'url' | 'user_declaration';
  label: string;
  explanation: string;
  verification?: Verification;
};

export type Agent = {
  id: string;
  title: string;
  organizer: string;
  type: 'competition' | 'assignment' | 'application';
  status: 'active' | 'review_required' | 'completed';
  targetDeadline: string;
  deadlineNote: string;
  sourceLabel: string;
  sourceType: string;
  claims: Claim[];
  tasks: Task[];
  evidence: Evidence[];
  isDemo: boolean;
  lastUpdated: string;
};

export type ActivityEvent = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'info' | 'success' | 'warning';
};

const demoAgent: Agent = {
  id: 'demo-competition-2026',
  title: 'Northstar Build Challenge',
  organizer: 'Northstar Student Labs',
  type: 'competition',
  status: 'active',
  targetDeadline: '2026-10-18T23:59:00+08:00',
  deadlineNote: '18 Oct 2026 · 11:59 PM MYT',
  sourceLabel: 'northstar-poster.png',
  sourceType: 'Image poster',
  isDemo: true,
  lastUpdated: 'Just now',
  claims: [
    { id: 'claim-title', field: 'Opportunity title', value: 'Northstar Build Challenge', status: 'confirmed_from_source', confidence: 0.98, sourceExcerpt: 'NORTHSTAR BUILD CHALLENGE 2026', sourcePage: 1, reviewed: true },
    { id: 'claim-organizer', field: 'Organizer', value: 'Northstar Student Labs', status: 'confirmed_from_source', confidence: 0.94, sourceExcerpt: 'Presented by Northstar Student Labs', sourcePage: 1, reviewed: true },
    { id: 'claim-deadline', field: 'Submission deadline', value: '18 October 2026, 11:59 PM', status: 'inferred_needs_review', confidence: 0.78, sourceExcerpt: 'Submit by 18 Oct at 11:59 PM', sourcePage: 1, reviewed: false },
    { id: 'claim-eligibility', field: 'Eligibility', value: 'Current university students in teams of 2–4', status: 'confirmed_from_source', confidence: 0.91, sourceExcerpt: 'Open to current university students. Teams of 2–4.', sourcePage: 1, reviewed: true },
    { id: 'claim-missing', field: 'Required deliverable', value: 'Final demo video duration is not stated', status: 'missing', confidence: 0.42, sourceExcerpt: 'The poster does not specify a video duration.', sourcePage: 1, reviewed: false },
  ],
  tasks: [
    { id: 'task-eligibility', title: 'Confirm team eligibility', description: 'Check that every teammate is a current university student and the team has 2–4 members.', category: 'Eligibility', priority: 'high', status: 'completed_by_user', estimatedMinutes: 10, dependencyIds: [], completionCondition: 'All team members confirmed eligible.', evidenceRequired: true, evidenceId: 'evidence-eligibility', sourceClaimId: 'claim-eligibility' },
    { id: 'task-concept', title: 'Choose a problem and concept', description: 'Write a one-paragraph problem statement and agree on the product direction.', category: 'Plan', priority: 'high', status: 'in_progress', estimatedMinutes: 45, dependencyIds: [], completionCondition: 'Problem statement and concept are written.', evidenceRequired: true },
    { id: 'task-repo', title: 'Create the project repository', description: 'Create the repository, add a README, and choose an open-source license.', category: 'Build', priority: 'high', status: 'blocked', estimatedMinutes: 25, dependencyIds: ['task-concept'], completionCondition: 'Repository URL, README, and license are available.', evidenceRequired: true },
    { id: 'task-prototype', title: 'Build the first working prototype', description: 'Implement the smallest demonstrable path from input to a useful result.', category: 'Build', priority: 'high', status: 'ready', estimatedMinutes: 180, dependencyIds: ['task-concept'], completionCondition: 'A working prototype can be shown to another person.', evidenceRequired: true },
    { id: 'task-readme', title: 'Document the project', description: 'Explain the problem, solution, setup, limitations, and demo path.', category: 'Submission', priority: 'medium', status: 'ready', estimatedMinutes: 50, dependencyIds: ['task-repo'], completionCondition: 'README contains required sections.', evidenceRequired: true },
    { id: 'task-video', title: 'Record the demo video', description: 'Record a concise walkthrough of the working product.', category: 'Submission', priority: 'medium', status: 'ready', estimatedMinutes: 35, dependencyIds: ['task-prototype'], completionCondition: 'Demo video URL is attached.', evidenceRequired: true },
    { id: 'task-submit', title: 'Complete the final submission', description: 'Review all required fields and submit before the deadline.', category: 'Final review', priority: 'high', status: 'ready', deadline: '2026-10-18T23:59:00+08:00', estimatedMinutes: 20, dependencyIds: ['task-readme', 'task-video'], completionCondition: 'All required fields are complete and submission confirmation is saved.', evidenceRequired: true },
  ],
  evidence: [
    {
      id: 'evidence-eligibility',
      taskId: 'task-eligibility',
      type: 'user_declaration',
      label: 'Team eligibility declaration',
      explanation: 'I confirmed that our team has three current university students.',
      verification: {
        id: 'verification-eligibility',
        status: 'partially_verified',
        level: 1,
        method: 'User-confirmed completion',
        requirementsMet: ['Team size is within the stated range'],
        requirementsMissing: ['Student status has not been externally verified'],
        confidence: 1,
        limitations: ['This is a user declaration, not official verification.'],
        createdAt: '2026-09-20T11:20:00+08:00',
      },
    },
  ],
};

const activitySeed: ActivityEvent[] = [
  { id: 'activity-1', title: 'Demo competition activated', detail: 'Northstar Build Challenge is now tracking tasks and evidence.', time: 'Today, 9:42 AM', tone: 'success' },
  { id: 'activity-2', title: 'Extraction reviewed', detail: '4 claims were confirmed; 2 items still need review.', time: 'Today, 9:38 AM', tone: 'info' },
  { id: 'activity-3', title: 'Source captured', detail: 'northstar-poster.png was preserved as fictional demo data.', time: 'Today, 9:35 AM', tone: 'info' },
];

type AppContextValue = {
  agent: Agent;
  activities: ActivityEvent[];
  isHydrated: boolean;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  confirmClaim: (claimId: string, value?: string) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  addEvidence: (taskId: string, label: string, explanation: string) => void;
  runAudit: () => { ready: Task[]; missing: Task[]; blocked: Task[]; uncertain: Claim[] };
  createDemoAgent: () => void;
  signOut: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = 'actionlayer-state-v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent>(demoAgent);
  const [activities, setActivities] = useState<ActivityEvent[]>(activitySeed);
  const [isHydrated, setHydrated] = useState(false);
  const [isDemoMode, setDemoMode] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as { agent: Agent; activities: ActivityEvent[]; isDemoMode: boolean };
          setAgent(parsed.agent);
          setActivities(parsed.activities);
          setDemoMode(parsed.isDemoMode);
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ agent, activities, isDemoMode })).catch(() => undefined);
  }, [agent, activities, isDemoMode, isHydrated]);

  const pushActivity = (event: ActivityEvent) => setActivities((current) => [event, ...current]);
  const canStart = (task: Task) => task.dependencyIds.every((id) => agent.tasks.find((candidate) => candidate.id === id)?.status === 'completed_by_user' || agent.tasks.find((candidate) => candidate.id === id)?.status === 'verified');

  const confirmClaim = (claimId: string, value?: string) => {
    setAgent((current) => ({
      ...current,
      claims: current.claims.map((claim) => claim.id === claimId ? { ...claim, value: value?.trim() || claim.value, status: 'supplied_by_user', reviewed: true } : claim),
      lastUpdated: 'Just now',
    }));
    pushActivity({ id: `claim-${Date.now()}`, title: 'Claim reviewed', detail: 'A source-grounded item was confirmed by you.', time: 'Just now', tone: 'success' });
  };

  const startTask = (taskId: string) => {
    setAgent((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId && canStart(task) ? { ...task, status: 'in_progress' } : task),
      lastUpdated: 'Just now',
    }));
  };

  const completeTask = (taskId: string) => {
    setAgent((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId && canStart(task) ? { ...task, status: 'completed_by_user' } : task),
      lastUpdated: 'Just now',
    }));
    pushActivity({ id: `task-${Date.now()}`, title: 'Task completed', detail: 'A user-confirmed completion was recorded.', time: 'Just now', tone: 'success' });
  };

  const addEvidence = (taskId: string, label: string, explanation: string) => {
    const evidence: Evidence = {
      id: `evidence-${Date.now()}`,
      taskId,
      type: 'text',
      label,
      explanation,
      verification: {
        id: `verification-${Date.now()}`,
        status: 'partially_verified',
        level: 2,
        method: 'Evidence attachment',
        requirementsMet: ['Evidence was attached to the task'],
        requirementsMissing: ['A rule-based verification method has not been run'],
        limitations: ['Attachment presence does not prove the underlying requirement.'],
        createdAt: new Date().toISOString(),
      },
    };
    setAgent((current) => ({
      ...current,
      evidence: [...current.evidence, evidence],
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, evidenceId: evidence.id, status: task.status === 'ready' ? 'submitted_for_review' : task.status } : task),
      lastUpdated: 'Just now',
    }));
    pushActivity({ id: `evidence-${Date.now()}`, title: 'Evidence attached', detail: `${label} is awaiting verification.` , time: 'Just now', tone: 'info' });
  };

  const runAudit = () => {
    const ready = agent.tasks.filter((task) => (task.status === 'completed_by_user' || task.status === 'verified') && (!task.evidenceRequired || Boolean(task.evidenceId)));
    const missing = agent.tasks.filter((task) => task.status !== 'completed_by_user' && task.status !== 'verified' && task.status !== 'blocked');
    const blocked = agent.tasks.filter((task) => task.status === 'blocked' || !canStart(task));
    const uncertain = agent.claims.filter((claim) => !claim.reviewed || claim.status === 'inferred_needs_review' || claim.status === 'missing' || claim.status === 'conflicting');
    pushActivity({ id: `audit-${Date.now()}`, title: 'Readiness audit run', detail: `${ready.length} ready, ${missing.length} missing, ${uncertain.length} need review.`, time: 'Just now', tone: 'warning' });
    return { ready, missing, blocked, uncertain };
  };

  const createDemoAgent = () => {
    setAgent({ ...demoAgent, lastUpdated: 'Just now' });
    setActivities(activitySeed);
  };

  const value = useMemo<AppContextValue>(() => ({
    agent,
    activities,
    isHydrated,
    isDemoMode,
    toggleDemoMode: () => setDemoMode((current) => !current),
    confirmClaim,
    startTask,
    completeTask,
    addEvidence,
    runAudit,
    createDemoAgent,
    signOut: () => setDemoMode(false),
  }), [agent, activities, isDemoMode, isHydrated]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

export function getProgress(agent: Agent) {
  const total = agent.tasks.reduce((sum, task) => sum + (task.priority === 'high' ? 2 : 1), 0);
  const complete = agent.tasks.reduce((sum, task) => sum + ((task.status === 'completed_by_user' || task.status === 'verified') ? (task.priority === 'high' ? 2 : 1) : 0), 0);
  return total === 0 ? 0 : Math.round((complete / total) * 100);
}

export function getNextAction(agent: Agent) {
  const blocked = agent.tasks.find((task) => task.status === 'blocked');
  if (blocked) {
    const dependency = agent.tasks.find((task) => blocked.dependencyIds.includes(task.id));
    return { task: dependency ?? blocked, blockedTask: blocked };
  }
  const next = agent.tasks.find((task) => (task.status === 'ready' || task.status === 'in_progress') && task.dependencyIds.every((id) => agent.tasks.find((candidate) => candidate.id === id)?.status === 'completed_by_user' || agent.tasks.find((candidate) => candidate.id === id)?.status === 'verified'));
  return { task: next ?? agent.tasks[0] };
}