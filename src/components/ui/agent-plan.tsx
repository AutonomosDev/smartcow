/**
 * src/components/ui/agent-plan.tsx
 * Adaptado de 21st.dev/r/isaiahbjork/agent-plan para SmartCow.
 * Ticket: AUT-113
 *
 * Muestra el estado del agente Claude durante la ejecución de acciones.
 * Incluye animaciones suaves de expansión y estados visuales premium.
 */

"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentTaskStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "need-help"
  | "failed";

export interface AgentSubtask {
  id: string;
  title: string;
  description: string;
  status: AgentTaskStatus;
  priority?: string;
  tools?: string[];
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: AgentTaskStatus;
  priority?: string;
  level?: number;
  dependencies?: string[];
  subtasks: AgentSubtask[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

function StatusIcon({
  status,
  size = "sm",
}: {
  status: AgentTaskStatus;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  switch (status) {
    case "completed":
      return <CheckCircle2 className={cn(cls, "text-green-500")} />;
    case "in-progress":
      return <CircleDotDashed className={cn(cls, "text-blue-500 animate-spin-slow")} />;
    case "need-help":
      return <CircleAlert className={cn(cls, "text-yellow-500")} />;
    case "failed":
      return <CircleX className={cn(cls, "text-red-500")} />;
    default:
      return <Circle className={cn(cls, "text-muted-foreground")} />;
  }
}

const STATUS_BADGE_CLASS: Record<AgentTaskStatus, string> = {
  completed: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  "need-help": "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-muted text-muted-foreground",
};

// ─── Variants ────────────────────────────────────────────────────────────────

const taskVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 500, damping: 30 },
  },
  exit: { opacity: 0, y: -5, transition: { duration: 0.15 } },
};

const subtaskListVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    overflow: "visible",
    transition: {
      duration: 0.25,
      staggerChildren: 0.05,
      when: "beforeChildren" as const,
      ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number],
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: { duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] },
  },
};

const subtaskVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 500, damping: 25 },
  },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

const subtaskDetailsVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    overflow: "visible",
    transition: { duration: 0.25, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] },
  },
};

// ─── AgentPlan Component ──────────────────────────────────────────────────────

interface AgentPlanProps {
  tasks: AgentTask[];
  className?: string;
}

export function AgentPlan({ tasks, className }: AgentPlanProps) {
  const [expandedTasks, setExpandedTasks] = useState<string[]>(() =>
    tasks.filter((t) => t.status === "in-progress").map((t) => t.id)
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSubtaskExpansion = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (tasks.length === 0) return null;

  return (
    <div className={cn("bg-transparent text-foreground w-full max-w-2xl px-2 mb-4", className)}>
      <motion.div
        className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
      >
        <LayoutGroup>
          <div className="p-4 pt-3 overflow-hidden">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Plan de ejecución del Agente
            </h4>
            <ul className="space-y-1 overflow-hidden">
              {tasks.map((task, index) => {
                const isExpanded = expandedTasks.includes(task.id);

                return (
                  <motion.li
                    key={task.id}
                    className={cn(index !== 0 ? "mt-1 pt-2" : "", "list-none")}
                    initial="hidden"
                    animate="visible"
                    variants={taskVariants}
                  >
                    {/* Task row */}
                    <motion.div
                      className="group flex items-center px-3 py-1.5 rounded-xl cursor-not-allowed"
                      whileHover={{
                        backgroundColor: "rgba(0,0,0,0.02)",
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div className="mr-3 flex-shrink-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={task.status}
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <StatusIcon status={task.status} size="md" />
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <div
                        className="flex min-w-0 flex-grow items-center justify-between cursor-pointer"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <div className="mr-2 flex-1 truncate">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              task.status === "completed"
                                ? "text-gray-400 line-through"
                                : "text-gray-700"
                            )}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex flex-shrink-0 items-center space-x-2 text-[10px]">
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="flex gap-1 mr-2">
                              {task.dependencies.map((dep, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                  {dep}
                                </span>
                              ))}
                            </div>
                          )}
                          <motion.span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-bold uppercase tracking-tight",
                              STATUS_BADGE_CLASS[task.status]
                            )}
                            key={task.status}
                          >
                            {task.status}
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Subtasks */}
                    <AnimatePresence mode="wait">
                      {isExpanded && task.subtasks.length > 0 && (
                        <motion.div
                          className="relative overflow-hidden"
                          variants={subtaskListVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          layout
                        >
                          <div className="absolute top-0 bottom-0 left-[22px] border-l border-dashed border-gray-200" />
                          <ul className="mt-1 mr-2 mb-1.5 ml-3 space-y-0.5 list-none">
                            {task.subtasks.map((subtask) => {
                              const subtaskKey = `${task.id}-${subtask.id}`;
                              const isSubtaskExpanded = expandedSubtasks[subtaskKey];

                              return (
                                <motion.li
                                  key={subtask.id}
                                  className="group flex flex-col py-0.5 pl-6"
                                  onClick={() =>
                                    toggleSubtaskExpansion(task.id, subtask.id)
                                  }
                                  variants={subtaskVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  layout
                                >
                                  <motion.div
                                    className="flex flex-1 items-center rounded-lg p-1 hover:bg-black/5 transition-colors"
                                    layout
                                  >
                                    <div className="mr-2.5 flex-shrink-0">
                                      <AnimatePresence mode="wait">
                                        <motion.div
                                          key={subtask.status}
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.8 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <StatusIcon status={subtask.status} size="sm" />
                                        </motion.div>
                                      </AnimatePresence>
                                    </div>

                                    <span
                                      className={cn(
                                        "text-[13px]",
                                        subtask.status === "completed"
                                          ? "text-gray-400 line-through"
                                          : "text-gray-600"
                                      )}
                                    >
                                      {subtask.title}
                                    </span>
                                  </motion.div>

                                  <AnimatePresence mode="wait">
                                    {isSubtaskExpanded && (
                                      <motion.div
                                        className="text-gray-500 border-gray-100 mt-1 ml-1.5 border-l border-dashed pl-5 text-[11px] overflow-hidden"
                                        variants={subtaskDetailsVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        layout
                                      >
                                        <p className="py-1">{subtask.description}</p>
                                        {subtask.tools && subtask.tools.length > 0 && (
                                          <div className="mt-1 mb-2 flex flex-wrap items-center gap-1.5">
                                            <span className="font-semibold text-gray-300">
                                              HERRAMIENTAS:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                              {subtask.tools.map((tool, idx) => (
                                                <motion.span
                                                  key={idx}
                                                  className="bg-brand-light/10 text-brand-dark px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm border border-brand-light/20"
                                                  initial={{ opacity: 0, y: -5 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                >
                                                  {tool}
                                                </motion.span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
