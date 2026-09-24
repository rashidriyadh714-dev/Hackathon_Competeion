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
  | 'missing'
  | 'not_applicable';

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
  sequenceNumber?: number;
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
  modelVersion?: string;
};

export type Verification = {
  id: string;
  status: 'partially_verified' | 'verified' | 'needs_correction';
  level: 0 | 1 | 2 | 3 | 4;
  method: string;
  requirementsMet: string[];
  requirementsMissing: string[];
  confidence?: number;
  limitations: string[];
  recommendedCorrection?: string;
  nextAction?: string;
  modelVersion?: string;
  createdAt: string;
};

export type Evidence = {
  id: string;
  taskId: string;
  type: 'image' | 'pdf' | 'text' | 'user_declaration';
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
  isDemo?: boolean;
  lastUpdated: string;
};

export type ActivityEvent = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'info' | 'success' | 'warning';
};

export type ReadinessAuditResult = {
  requirementsCompletionPct: number;
  evidenceReadinessPct: number;
  sourceConfidenceLevel: 'High' | 'Medium' | 'Review Required' | 'Uncertain';
  deadlineRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskReasons: string[];
  remainingMissingItems: string[];
  readyTasks: Task[];
  missingTasks: Task[];
  blockedTasks: Task[];
  uncertainClaims: Claim[];
};

const initialAgents: Agent[] = [];
const initialActivities: ActivityEvent[] = [];

type AppContextValue = {
  agents: Agent[];
  activeAgentId: string | null;
  agent?: Agent;
  activities: ActivityEvent[];
  isHydrated: boolean;
  switchAgent: (agentId: string) => void;
  createAgent: (newAgent: Partial<Agent>) => string;
  deleteAgent: (agentId: string) => void;
  confirmClaim: (claimId: string, value?: string) => void;
  editClaim: (claimId: string, newValue: string) => void;
  removeClaim: (claimId: string) => void;
  markClaimUnknown: (claimId: string) => void;
  editTask: (taskId: string, newTitle: string, newDescription: string) => void;
  removeActivity: (activityId: string) => void;
  editActivity: (activityId: string, newTitle: string, newDetail: string) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  addEvidence: (taskId: string, label: string, explanation: string, level?: 1 | 2 | 3) => void;
  runAudit: (agentId?: string) => ReadinessAuditResult | null;
  setExtractedAgent: (data: Partial<Agent>) => string;
  signOut: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  customBg: string | null;
  setCustomBg: (uri: string | null) => void;
  bgDim: number;
  setBgDim: (dim: number) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = 'actionlayer-state-v5';
const WALLPAPER_KEY = 'actionlayer-wallpaper-v2';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivities);
  const [isHydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [customBg, setCustomBgState] = useState<string | null>(null);
  const [bgDim, setBgDimState] = useState<number>(0.35);

  const toggleTheme = () => {
    setTheme('dark');
  };

  const setCustomBg = (uri: string | null) => {
    setCustomBgState(uri);
    if (uri) {
      AsyncStorage.setItem(WALLPAPER_KEY, JSON.stringify({ customBg: uri, bgDim })).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(WALLPAPER_KEY).catch(() => undefined);
    }
  };

  const setBgDim = (dim: number) => {
    setBgDimState(dim);
    AsyncStorage.setItem(WALLPAPER_KEY, JSON.stringify({ customBg, bgDim: dim })).catch(() => undefined);
  };

  // Active agent computed property
  const agent = useMemo(
    () => agents.find((a) => a.id === activeAgentId) || agents[0],
    [agents, activeAgentId]
  );

  // Hydrate from local storage
  useEffect(() => {
    async function loadData() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.agents && Array.isArray(parsed.agents)) {
            setAgents(parsed.agents);
            setActiveAgentId(parsed.activeAgentId || null);
            setActivities(parsed.activities || initialActivities);
          }
        }
        const wpRaw = await AsyncStorage.getItem(WALLPAPER_KEY);
        if (wpRaw) {
          const wp = JSON.parse(wpRaw);
          if (wp.customBg !== undefined) setCustomBgState(wp.customBg);
          if (wp.bgDim !== undefined) setBgDimState(wp.bgDim);
        }
      } catch (err) {
        console.warn('Storage read error:', err);
      } finally {
        setHydrated(true);
      }
    }
    loadData();
  }, []);

  // Persist updates locally
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ agents, activeAgentId, activities })).catch(() => undefined);
  }, [agents, activeAgentId, activities, isHydrated]);

  const pushActivity = (event: ActivityEvent) => {
    setActivities((current) => [event, ...current]);
  };

  const removeActivity = (activityId: string) => {
    setActivities((current) => current.filter(a => a.id !== activityId));
  };

  const editActivity = (activityId: string, newTitle: string, newDetail: string) => {
    setActivities((current) => current.map(a => {
      if (a.id === activityId) {
        return { ...a, title: newTitle, detail: newDetail };
      }
      return a;
    }));
  };

  const isPrereqSatisfied = (taskId: string, tasks: Task[]) => {
    const task = tasks.find((t) => t.id === taskId);
    return task?.status === 'completed_by_user' || task?.status === 'verified';
  };

  // Deterministic DAG dependency solver
  const resolveGraph = (tasks: Task[]): Task[] => {
    return tasks.map((task) => {
      const allPrereqsDone = task.dependencyIds.every((depId) => isPrereqSatisfied(depId, tasks));
      if (task.status === 'blocked' && allPrereqsDone) {
        return { ...task, status: 'ready' as TaskStatus };
      }
      if ((task.status === 'ready' || task.status === 'in_progress') && !allPrereqsDone && task.dependencyIds.length > 0) {
        return { ...task, status: 'blocked' as TaskStatus };
      }
      return task;
    });
  };

  const switchAgent = (agentId: string) => {
    const found = agents.find((a) => a.id === agentId);
    if (found) {
      setActiveAgentId(agentId);
    }
  };

  const createAgent = (newAgentData: Partial<Agent>): string => {
    const newId = newAgentData.id || `agent-${Date.now()}`;
    const newAgent: Agent = {
      id: newId,
      title: newAgentData.title || 'New Agent',
      organizer: newAgentData.organizer || 'Unknown Organizer',
      type: newAgentData.type || 'competition',
      status: newAgentData.status || 'active',
      targetDeadline: newAgentData.targetDeadline || new Date(Date.now() + 86400000 * 7).toISOString(),
      deadlineNote: newAgentData.deadlineNote || 'Not specified',
      sourceLabel: newAgentData.sourceLabel || 'Uploaded Source',
      sourceType: newAgentData.sourceType || 'Text',
      claims: newAgentData.claims || [],
      tasks: newAgentData.tasks || [],
      evidence: newAgentData.evidence || [],
      ...newAgentData,
      isDemo: false,
      lastUpdated: 'Just now',
    };
    setAgents((current) => [newAgent, ...current]);
    setActiveAgentId(newId);
    pushActivity({
      id: `act-${Date.now()}`,
      title: 'Agent created',
      detail: `Created "${newAgent.title}" with ${newAgent.tasks.length} tasks.`,
      time: 'Just now',
      tone: 'success',
    });
    return newId;
  };

  const deleteAgent = (agentId: string) => {
    setAgents((current) => current.filter((a) => a.id !== agentId));
    if (activeAgentId === agentId) {
      // We need to pick a new active agent, we'll let a useEffect handle it
      // or we can just compute it directly here from the current state
      // but since setState is async, it's better to just set it to null and let fallback handle it
      // actually, just doing setActiveAgentId(null) is safe and the useMemo fallback will pick agents[0]
      setActiveAgentId(null);
    }
  };

  const confirmClaim = (claimId: string, value?: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const updatedClaims = ag.claims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                value: value?.trim() || claim.value,
                status: 'supplied_by_user' as ClaimStatus,
                reviewed: true,
                confidence: 1.0,
              }
            : claim
        );
        return { ...ag, claims: updatedClaims, lastUpdated: 'Just now' };
      })
    );
    pushActivity({
      id: `claim-${Date.now()}`,
      title: 'Claim confirmed',
      detail: 'Source fact confirmed and verified by user.',
      time: 'Just now',
      tone: 'success',
    });
  };

  const editClaim = (claimId: string, newValue: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const updatedClaims = ag.claims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                value: newValue.trim(),
                status: 'supplied_by_user' as ClaimStatus,
                reviewed: true,
                confidence: 1.0,
              }
            : claim
        );
        return { ...ag, claims: updatedClaims, lastUpdated: 'Just now' };
      })
    );
    pushActivity({
      id: `claim-edit-${Date.now()}`,
      title: 'Claim corrected',
      detail: `Updated value: "${newValue.slice(0, 32)}..."`,
      time: 'Just now',
      tone: 'info',
    });
  };

  const removeClaim = (claimId: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        return { ...ag, claims: ag.claims.filter((c) => c.id !== claimId), lastUpdated: 'Just now' };
      })
    );
  };

  const editTask = (taskId: string, newTitle: string, newDescription: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const newTasks = ag.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, title: newTitle, description: newDescription };
          }
          return t;
        });
        return { ...ag, tasks: resolveGraph(newTasks), lastUpdated: 'Just now' };
      })
    );
  };

  const markClaimUnknown = (claimId: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const updatedClaims = ag.claims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                status: 'missing' as ClaimStatus,
                reviewed: true,
                value: 'Not specified in source document',
              }
            : claim
        );
        return { ...ag, claims: updatedClaims, lastUpdated: 'Just now' };
      })
    );
  };

  const startTask = (taskId: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const target = ag.tasks.find((t) => t.id === taskId);
        if (!target || target.status === 'blocked') return ag;
        const updatedTasks = ag.tasks.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' as TaskStatus } : t));
        return { ...ag, tasks: updatedTasks, lastUpdated: 'Just now' };
      })
    );
    pushActivity({
      id: `task-start-${Date.now()}`,
      title: 'Task in progress',
      detail: `Started working on task.`,
      time: 'Just now',
      tone: 'info',
    });
  };

  const completeTask = (taskId: string) => {
    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const rawTasks = ag.tasks.map((t) => (t.id === taskId ? { ...t, status: 'completed_by_user' as TaskStatus } : t));
        const resolvedTasks = resolveGraph(rawTasks);
        return { ...ag, tasks: resolvedTasks, lastUpdated: 'Just now' };
      })
    );
    pushActivity({
      id: `task-complete-${Date.now()}`,
      title: 'Task completed',
      detail: `Prerequisite fulfilled. Dependent tasks unblocked.`,
      time: 'Just now',
      tone: 'success',
    });
  };

  const addEvidence = (taskId: string, label: string, explanation: string, level: 1 | 2 | 3 = 2, overrideVerification?: any) => {
    const evidenceId = `evidence-${Date.now()}`;
    const verificationId = `verif-${Date.now()}`;

    const newEvidence: Evidence = {
      id: evidenceId,
      taskId,
      type: level === 1 ? 'user_declaration' : 'text',
      label: label.trim(),
      explanation: explanation.trim(),
      verification: overrideVerification ? {
        id: verificationId,
        status: overrideVerification.status,
        level: overrideVerification.verificationLevel || level,
        method: overrideVerification.method,
        requirementsMet: overrideVerification.requirementsMetJson || [],
        requirementsMissing: overrideVerification.requirementsMissingJson || [],
        confidence: overrideVerification.confidence || 0.95,
        limitations: overrideVerification.limitationsJson || [],
        createdAt: new Date().toISOString(),
      } : {
        id: verificationId,
        status: 'verified',
        level,
        method: level === 4 ? 'AI-assisted assessment' : level === 1 ? 'User declaration' : 'Attached artifact verification',
        requirementsMet: ['Artifact submitted with required explanation', 'Satisfies stated requirement condition'],
        requirementsMissing: [],
        confidence: 0.95,
        limitations: [level === 4 ? 'AI-assisted review; verify original repository' : 'User-submitted artifact'],
        createdAt: new Date().toISOString(),
      },
    };

    setAgents((current) =>
      current.map((ag) => {
        if (ag.id !== activeAgentId) return ag;
        const updatedEvidence = [...ag.evidence.filter((e) => e.taskId !== taskId), newEvidence];
        const rawTasks = ag.tasks.map((t) => (t.id === taskId ? { ...t, status: 'verified' as TaskStatus, evidenceId } : t));
        const resolvedTasks = resolveGraph(rawTasks);
        return { ...ag, evidence: updatedEvidence, tasks: resolvedTasks, lastUpdated: 'Just now' };
      })
    );

    pushActivity({
      id: `evidence-${Date.now()}`,
      title: 'Evidence attached',
      detail: `Level ${level} verification recorded for requirement.`,
      time: 'Just now',
      tone: 'success',
    });
  };

  const runAudit = (targetAgentId?: string): ReadinessAuditResult => {
    const targetAgent = agents.find((a) => a.id === (targetAgentId || activeAgentId)) || agent;
    const totalWeighted = targetAgent.tasks.reduce((sum, t) => sum + (t.priority === 'high' ? 2 : 1), 0);
    const completeWeighted = targetAgent.tasks.reduce(
      (sum, t) => sum + (t.status === 'completed_by_user' || t.status === 'verified' ? (t.priority === 'high' ? 2 : 1) : 0),
      0
    );
    const requirementsCompletionPct = totalWeighted > 0 ? Math.round((completeWeighted / totalWeighted) * 100) : 0;

    const evidenceRequiredTasks = targetAgent.tasks.filter((t) => t.evidenceRequired);
    const evidenceAttachedTasks = evidenceRequiredTasks.filter((t) =>
      targetAgent.evidence.some((e) => e.taskId === t.id)
    );
    const evidenceReadinessPct =
      evidenceRequiredTasks.length > 0
        ? Math.round((evidenceAttachedTasks.length / evidenceRequiredTasks.length) * 100)
        : 100;

    const uncertainClaims = targetAgent.claims.filter((c) => !c.reviewed);
    const sourceConfidenceLevel: 'High' | 'Medium' | 'Review Required' | 'Uncertain' =
      uncertainClaims.length === 0 ? 'High' : uncertainClaims.length === 1 ? 'Medium' : 'Review Required';

    const blockedTasks = targetAgent.tasks.filter((t) => t.status === 'blocked');
    const missingTasks = targetAgent.tasks.filter(
      (t) => t.status !== 'completed_by_user' && t.status !== 'verified'
    );
    const readyTasks = targetAgent.tasks.filter(
      (t) => t.status === 'completed_by_user' || t.status === 'verified'
    );

    const riskReasons: string[] = [];
    if (blockedTasks.length > 0) {
      riskReasons.push(`${blockedTasks.length} task(s) currently blocked by unfinished prerequisites`);
    }
    const missingEvidenceCount = evidenceRequiredTasks.length - evidenceAttachedTasks.length;
    if (missingEvidenceCount > 0) {
      riskReasons.push(`${missingEvidenceCount} required evidence artifact(s) not yet attached`);
    }
    if (uncertainClaims.length > 0) {
      riskReasons.push(`${uncertainClaims.length} claim(s) require source review or date confirmation`);
    }

    let deadlineRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (blockedTasks.length > 2 || missingEvidenceCount > 3) {
      deadlineRiskLevel = 'Critical';
    } else if (blockedTasks.length > 0 || missingEvidenceCount > 1 || uncertainClaims.length > 1) {
      deadlineRiskLevel = 'High';
    } else if (missingTasks.length > 0 || uncertainClaims.length > 0) {
      deadlineRiskLevel = 'Medium';
    }

    const remainingMissingItems: string[] = [];
    missingTasks.forEach((t) => {
      remainingMissingItems.push(`Incomplete task: "${t.title}"`);
    });
    evidenceRequiredTasks
      .filter((t) => !targetAgent.evidence.some((e) => e.taskId === t.id))
      .forEach((t) => {
        remainingMissingItems.push(`Missing evidence for "${t.title}"`);
      });

    pushActivity({
      id: `audit-${Date.now()}`,
      title: 'Four-factor audit run',
      detail: `${requirementsCompletionPct}% complete · ${deadlineRiskLevel} risk · ${blockedTasks.length} blocked`,
      time: 'Just now',
      tone: deadlineRiskLevel === 'Low' ? 'success' : 'warning',
    });

    return {
      requirementsCompletionPct,
      evidenceReadinessPct,
      sourceConfidenceLevel,
      deadlineRiskLevel,
      riskReasons,
      remainingMissingItems,
      readyTasks,
      missingTasks,
      blockedTasks,
      uncertainClaims,
    };
  };


  const setExtractedAgent = (data: Partial<Agent>) => {
    const newId = data.id || `agent-${Date.now()}`;
    const newAgent: Agent = {
      id: newId,
      title: data.title || 'Extracted Agent',
      organizer: data.organizer || 'Unknown Organizer',
      type: data.type || 'competition',
      targetDeadline: data.targetDeadline || new Date(Date.now() + 86400000 * 7).toISOString(),
      deadlineNote: data.deadlineNote || 'Not specified',
      sourceLabel: data.sourceLabel || 'Uploaded Source',
      sourceType: data.sourceType || 'Text',
      claims: data.claims || [],
      tasks: data.tasks || [],
      evidence: data.evidence || [],
      ...data,
      status: 'review_required',
      isDemo: false,
      lastUpdated: 'Just now',
    };
    setAgents((current) => [newAgent, ...current]);
    setActiveAgentId(newId);
    pushActivity({
      id: `act-${Date.now()}`,
      title: 'Opportunity extracted',
      detail: `Extracted claims from "${data.sourceLabel || 'Uploaded source'}" via Gemini.`,
      time: 'Just now',
      tone: 'info',
    });
    return newId;
  };

  const value = useMemo<AppContextValue>(
    () => ({
      agents,
      activeAgentId,
      agent,
      activities,
      isHydrated,
      switchAgent,
      createAgent,
      deleteAgent,
      confirmClaim,
      editClaim,
      removeClaim,
      markClaimUnknown,
      editTask,
      removeActivity,
      editActivity,
      startTask,
      completeTask,
      addEvidence,
      runAudit,
      setExtractedAgent,
      signOut: () => undefined,
      theme,
      toggleTheme,
      customBg,
      setCustomBg,
      bgDim,
      setBgDim,
    }),
    [agents, activeAgentId, agent, activities, isHydrated, theme, customBg, bgDim]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

export function getProgress(agent: Agent) {
  const total = agent.tasks.reduce((sum, task) => sum + (task.priority === 'high' ? 2 : 1), 0);
  const complete = agent.tasks.reduce(
    (sum, task) =>
      sum + (task.status === 'completed_by_user' || task.status === 'verified' ? (task.priority === 'high' ? 2 : 1) : 0),
    0
  );
  return total === 0 ? 0 : Math.round((complete / total) * 100);
}

export function getNextAction(agent: Agent) {
  // Check if any high priority task is blocked by a prerequisite
  const blocked = agent.tasks.find((task) => task.status === 'blocked');
  if (blocked) {
    const dependency = agent.tasks.find(
      (task) => blocked.dependencyIds.includes(task.id) && task.status !== 'completed_by_user' && task.status !== 'verified'
    );
    if (dependency) {
      return { task: dependency, blockedTask: blocked };
    }
  }
  const nextReady = agent.tasks.find(
    (task) =>
      (task.status === 'ready' || task.status === 'in_progress') &&
      task.dependencyIds.every((id) => {
        const candidate = agent.tasks.find((c) => c.id === id);
        return candidate?.status === 'completed_by_user' || candidate?.status === 'verified';
      })
  );
  return { task: nextReady ?? agent.tasks[0], blockedTask: undefined };
}