import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE;


type TaskStatus = "offen" | "in_bearbeitung" | "erledigt";
type TaskPriority = "niedrig" | "mittel" | "hoch";
type ViewMode = "liste" | "kanban";

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by?: string;
  created_at?: string;
};

type TokenResponse = {
  access: string;
  refresh: string;
};

type RefreshResponse = {
  access: string;
};

type TaskStats = {
  total: number;
  open: number;
  in_progress: number;
  done: number;
  overdue: number;
  high_priority: number;
};

const emptyStats: TaskStats = {
  total: 0,
  open: 0,
  in_progress: 0,
  done: 0,
  overdue: 0,
  high_priority: 0,
};

const KANBAN_COLUMNS: TaskStatus[] = ["offen", "in_bearbeitung", "erledigt"];

export default function App() {
  const [access, setAccess] = useState<string>(localStorage.getItem("access") || "");
  const [refresh, setRefresh] = useState<string>(localStorage.getItem("refresh") || "");

  const editTitleInputRef = useRef<HTMLInputElement | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>(emptyStats);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [registerUsername, setRegisterUsername] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");
  const [registerPasswordRepeat, setRegisterPasswordRepeat] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>("offen");
  const [priority, setPriority] = useState<TaskPriority>("mittel");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("offen");
  const [editPriority, setEditPriority] = useState<TaskPriority>("mittel");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [isUpdatingTask, setIsUpdatingTask] = useState<boolean>(false);

  const [filter, setFilter] = useState<"alle" | TaskStatus>("alle");
  const [sort, setSort] = useState<"none" | "desc" | "asc">("none");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState<string>("");

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [lastMovedTaskId, setLastMovedTaskId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));


  const handleGuestLogin = async () => {
  try {
    const response = await fetch(`${API_BASE}/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "demo",
        password: "demo123456",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError("Gastmodus fehlgeschlagen.");
      return;
    }

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    setAccess(data.access);
    setRefresh(data.refresh);

    showSuccess("🚀 Gastmodus gestartet");
  } catch {
    setError("Gastmodus fehlgeschlagen.");
  }
};

  const chartDataStatus = [
    { name: "Offen", value: stats.open },
    { name: "In Bearbeitung", value: stats.in_progress },
    { name: "Erledigt", value: stats.done },
  ];

  const chartDataPriority = [
    { name: "Hoch", value: stats.high_priority },
    { name: "Andere", value: Math.max(stats.total - stats.high_priority, 0) },
  ];

  const showSuccess = useCallback((message: string): void => {
    setSuccess(message);
    window.setTimeout(() => {
      setSuccess("");
    }, 2000);
  }, []);

  const closeEditModal = useCallback((): void => {
    setIsEditModalOpen(false);
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditStatus("offen");
    setEditPriority("mittel");
    setEditDueDate("");
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccess("");
    setRefresh("");
    setTasks([]);
    setStats(emptyStats);
    setError("");
    setSuccess("");
    closeEditModal();
  }, [closeEditModal]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!refresh) {
      logout();
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        logout();
        return null;
      }

      const data = (await response.json()) as RefreshResponse;
      localStorage.setItem("access", data.access);
      setAccess(data.access);
      return data.access;
    } catch {
      logout();
      return null;
    }
  }, [refresh, logout]);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers ?? {});
      if (access) {
        headers.set("Authorization", `Bearer ${access}`);
      }

      let response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        const newAccess = await refreshToken();
        if (!newAccess) return response;

        const retryHeaders = new Headers(options.headers ?? {});
        retryHeaders.set("Authorization", `Bearer ${newAccess}`);

        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      }

      return response;
    },
    [access, refreshToken]
  );

  const loadStats = useCallback(async (): Promise<void> => {
    if (!access) return;

    try {
      const response = await authFetch(`${API_BASE}/stats/`);
      if (!response.ok) return;

      const data = (await response.json()) as TaskStats;
      setStats(data);
    } catch {
      // Statistiken sind optional. Keine Fehlermeldung nötig.
    }
  }, [access, authFetch]);

  const loadTasks = useCallback(async (): Promise<void> => {
    if (!access) return;

    setLoading(true);
    setError("");

    try {
      const response = await authFetch(`${API_BASE}/tasks/`);

      if (!response.ok) {
        setError("Fehler beim Laden der Tasks.");
        return;
      }

      const data = (await response.json()) as Task[];
      setTasks(data);
    } catch {
      setError("Fehler beim Laden der Tasks.");
    } finally {
      setLoading(false);
    }
  }, [access, authFetch]);

  const reloadData = useCallback(async (): Promise<void> => {
    await loadTasks();
    await loadStats();
  }, [loadTasks, loadStats]);

  const resetCreateForm = (): void => {
    setTitle("");
    setDescription("");
    setStatus("offen");
    setPriority("mittel");
    setDueDate("");
  };

  useEffect(() => {
    if (!access) return;

    const run = async (): Promise<void> => {
      await reloadData();
    };

    void run();
  }, [access, reloadData]);

  useEffect(() => {
    if (!isEditModalOpen) return;

    editTitleInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEditModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditModalOpen, closeEditModal]);

  const login = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as Partial<TokenResponse> & {
        detail?: string;
      };

      if (!response.ok || !data.access || !data.refresh) {
        setError("Login fehlgeschlagen.");
        return;
      }

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      setAccess(data.access);
      setRefresh(data.refresh);
      setPassword("");
      showSuccess("✅ Erfolgreich eingeloggt");
    } catch {
      setError("Login fehlgeschlagen.");
    }
  };

  const register = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!registerUsername.trim()) {
    setError("Bitte gib einen Benutzernamen ein.");
    return;
  }

  if (registerPassword.length < 8) {
    setError("Das Passwort muss mindestens 8 Zeichen haben.");
    return;
  }

  if (registerPassword !== registerPasswordRepeat) {
    setError("Die Passwörter stimmen nicht überein.");
    return;
  }

  setIsRegistering(true);

  try {
    const response = await fetch(`${API_BASE}/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: registerUsername,
        password: registerPassword,
      }),
    });

    const data = (await response.json()) as {
      message?: string;
      detail?: string;
      username?: string;
    };

    if (!response.ok) {
      setError(data.detail || "Registrierung fehlgeschlagen.");
      return;
    }

    setUsername(registerUsername);
    setPassword(registerPassword);
    setRegisterUsername("");
    setRegisterPassword("");
    setRegisterPasswordRepeat("");
    setIsRegisterMode(false);
    showSuccess("✅ Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
  } catch {
    setError("Registrierung fehlgeschlagen.");
  } finally {
    setIsRegistering(false);
  }
};

  const createTask = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await authFetch(`${API_BASE}/tasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          due_date: dueDate || null,
        }),
      });

      if (!response.ok) {
        setError("Fehler beim Speichern.");
        return;
      }

      resetCreateForm();
      await reloadData();
      showSuccess("✅ Task gespeichert!");
    } catch {
      setError("Fehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditTask = (task: Task): void => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ?? "");
    setIsEditModalOpen(true);
  };

  const updateTaskFromModal = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (editingTaskId === null) return;

    setError("");
    setSuccess("");
    setIsUpdatingTask(true);

    try {
      const response = await authFetch(`${API_BASE}/tasks/${editingTaskId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          status: editStatus,
          priority: editPriority,
          due_date: editDueDate || null,
        }),
      });

      if (!response.ok) {
        setError("Fehler beim Aktualisieren.");
        return;
      }

      closeEditModal();
      await reloadData();
      showSuccess("✏️ Task aktualisiert");
    } catch {
      setError("Fehler beim Aktualisieren.");
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const deleteTask = async (id: number): Promise<void> => {
    setError("");
    setSuccess("");

    try {
      const response = await authFetch(`${API_BASE}/tasks/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Fehler beim Löschen.");
        return;
      }

      if (editingTaskId === id) {
        closeEditModal();
      }

      await reloadData();
      showSuccess("🗑️ Task gelöscht");
    } catch {
      setError("Fehler beim Löschen.");
    }
  };

  const updateTaskStatus = useCallback(
    async (taskId: number, newStatus: TaskStatus): Promise<void> => {
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask || currentTask.status === newStatus) return;

      const previousTasks = tasks;
      const optimisticTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );

      setTasks(optimisticTasks);
      setLastMovedTaskId(taskId);

      try {
        const response = await authFetch(`${API_BASE}/tasks/${taskId}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentTask.title,
            description: currentTask.description,
            status: newStatus,
            priority: currentTask.priority,
            due_date: currentTask.due_date,
          }),
        });

        if (!response.ok) {
          setTasks(previousTasks);
          setLastMovedTaskId(null);
          setError("Status konnte nicht aktualisiert werden.");
          return;
        }

        await reloadData();
        showSuccess("↔️ Task verschoben");
        window.setTimeout(() => {
          setLastMovedTaskId(null);
        }, 1200);
      } catch {
        setTasks(previousTasks);
        setLastMovedTaskId(null);
        setError("Status konnte nicht aktualisiert werden.");
      }
    },
    [tasks, authFetch, reloadData, showSuccess]
  );

  const priorityWeight = (p: TaskPriority): number => {
    if (p === "hoch") return 3;
    if (p === "mittel") return 2;
    return 1;
  };

  const visibleTasks = useMemo((): Task[] => {
    let result = [...tasks];

    result = result.filter((task) => {
      if (filter !== "alle" && task.status !== filter) return false;

      if (
        search &&
        !task.title.toLowerCase().includes(search.toLowerCase()) &&
        !task.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    if (sort !== "none") {
      result.sort((a, b) => {
        const diff = priorityWeight(a.priority) - priorityWeight(b.priority);
        return sort === "asc" ? diff : -diff;
      });
    }

    return result;
  }, [tasks, filter, sort, search]);

  const tasksByStatus = useMemo(
    () => ({
      offen: visibleTasks.filter((task) => task.status === "offen"),
      in_bearbeitung: visibleTasks.filter((task) => task.status === "in_bearbeitung"),
      erledigt: visibleTasks.filter((task) => task.status === "erledigt"),
    }),
    [visibleTasks]
  );

  const activeTask =
    activeTaskId !== null ? tasks.find((task) => task.id === activeTaskId) || null : null;

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveTaskId(Number(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    setActiveTaskId(null);

    const taskId = Number(event.active.id);
    const newStatus = event.over?.id as TaskStatus | undefined;

    if (!newStatus) return;
    if (!KANBAN_COLUMNS.includes(newStatus)) return;

    await updateTaskStatus(taskId, newStatus);
  };

  if (!access) {
    return (
      <div style={pageStyle}>
        <div style={loginShellStyle}>
          <div style={loginCardStyle}>
            <div style={badgeStyle}>Automation Tool</div>
            <h1 style={heroTitleStyle}>Willkommen zurück</h1>
            <div
  style={{
    marginTop: "10px",
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.3)",
    color: "#93c5fd",
    fontSize: "0.9rem",
  }}
>
  <button
  style={{
    marginTop: "10px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  }}
  onClick={handleGuestLogin}
>
  🚀 Gastmodus starten
</button>
</div>
            <p style={heroTextStyle}>Melde dich an, um Aufgaben und Prozesse zentral zu verwalten.</p>

            {isRegisterMode ? (
  <form onSubmit={register} style={formStyle}>
    <input
      style={inputStyle}
      placeholder="Neuer Benutzername"
      value={registerUsername}
      onChange={(e) => setRegisterUsername(e.target.value)}
    />

    <input
      style={inputStyle}
      type="password"
      placeholder="Passwort mindestens 8 Zeichen"
      value={registerPassword}
      onChange={(e) => setRegisterPassword(e.target.value)}
    />

    <input
      style={inputStyle}
      type="password"
      placeholder="Passwort wiederholen"
      value={registerPasswordRepeat}
      onChange={(e) => setRegisterPasswordRepeat(e.target.value)}
    />

    <button style={primaryButtonStyle} type="submit" disabled={isRegistering}>
      {isRegistering ? "Registriert..." : "Registrieren"}
    </button>

    <button
      style={secondaryButtonStyle}
      type="button"
      onClick={() => {
        setIsRegisterMode(false);
        setError("");
        setSuccess("");
      }}
    >
      Zurück zum Login
    </button>
  </form>
) : (
  
  <form onSubmit={login} style={formStyle}>
              <input
                style={inputStyle}
                placeholder="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                style={inputStyle}
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button style={primaryButtonStyle} type="submit">
                Einloggen
              </button>

              <button
                style={secondaryButtonStyle}
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError("");
                  setSuccess("");
                }}
              >
                Neuen Account erstellen
              </button>
            </form>
          )}
                      

            {error ? <p style={errorStyle}>{error}</p> : null}
            {success ? <p style={successStyle}>{success}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroCardStyle}>
          <div style={heroHeaderStyle}>
            <div>
              <div style={badgeStyle}>Automation Tool</div>

              <h1 style={heroTitleStyle}>Digitale Aufgaben- und Prozessverwaltung</h1>

              <p style={heroTextStyle}>
                Dieses Projekt zeigt eine moderne Aufgaben- und Prozessverwaltung mit Django,
                React, JWT-Authentifizierung und Drag & Drop im Kanban-Board. Es verbindet
                saubere Backend-Logik mit einer klaren, praxisnahen UI.
              </p>

              <div style={heroBadgeRowStyle}>
                <span style={heroTechBadgeStyle}>Django REST</span>
                <span style={heroTechBadgeStyle}>React</span>
                <span style={heroTechBadgeStyle}>JWT</span>
                <span style={heroTechBadgeStyle}>Kanban</span>
                <span style={heroTechBadgeStyle}>Drag & Drop</span>
              </div>
            </div>

            <button style={secondaryButtonStyle} onClick={logout} type="button">
              Logout
            </button>
          </div>
        </section>

        <section style={statsGridStyle}>
          <StatCard label="Gesamt" value={stats.total} />
          <StatCard label="Offen" value={stats.open} />
          <StatCard label="In Bearbeitung" value={stats.in_progress} />
          <StatCard label="Erledigt" value={stats.done} />
          <StatCard label="Überfällig" value={stats.overdue} />
          <StatCard label="Hohe Priorität" value={stats.high_priority} />
        </section>

        <section style={chartGridStyle}>
          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Status Übersicht</h3>
            <div style={chartBoxStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataStatus} dataKey="value" outerRadius={90} label>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>Prioritäten</h3>
            <div style={chartBoxStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataPriority}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {error ? <p style={errorStyle}>{error}</p> : null}
        {success ? <p style={successStyle}>{success}</p> : null}

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Neue Aufgabe</h2>

          <form onSubmit={createTask} style={formGridStyle}>
            <input
              style={inputStyle}
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              style={inputStyle}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <select
              style={inputStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="offen">Offen</option>
              <option value="in_bearbeitung">In Bearbeitung</option>
              <option value="erledigt">Erledigt</option>
            </select>

            <select
              style={inputStyle}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="niedrig">Niedrig</option>
              <option value="mittel">Mittel</option>
              <option value="hoch">Hoch</option>
            </select>

            <textarea
              style={{ ...inputStyle, minHeight: "120px", gridColumn: "1 / -1" }}
              placeholder="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div style={{ ...buttonRowStyle, gridColumn: "1 / -1" }}>
              <button style={primaryButtonStyle} type="submit" disabled={isSaving}>
                {isSaving ? "Speichert..." : "Aufgabe speichern"}
              </button>
            </div>
          </form>
        </section>

        <section style={cardStyle}>
          <div style={filterRowStyle}>
            <select
              style={inputStyle}
              value={filter}
              onChange={(e) => setFilter(e.target.value as "alle" | TaskStatus)}
            >
              <option value="alle">Alle Status</option>
              <option value="offen">Offen</option>
              <option value="in_bearbeitung">In Bearbeitung</option>
              <option value="erledigt">Erledigt</option>
            </select>

            <select
              style={inputStyle}
              value={sort}
              onChange={(e) => setSort(e.target.value as "none" | "desc" | "asc")}
            >
              <option value="none">Keine Sortierung</option>
              <option value="desc">Priorität hoch → niedrig</option>
              <option value="asc">Priorität niedrig → hoch</option>
            </select>

            <select
              style={inputStyle}
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
            >
              <option value="kanban">Kanban</option>
              <option value="liste">Liste</option>
            </select>

            <input
              type="text"
              placeholder="🔍 Suche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Tasks</h2>

          {loading ? <p style={helperTextStyle}>Lade Tasks...</p> : null}

          {!loading && visibleTasks.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyStateEmojiStyle}>📭</div>
              <h3 style={emptyStateTitleStyle}>Keine passenden Aufgaben gefunden</h3>
              <p style={helperTextStyle}>Passe Filter oder Suche an, oder lege eine neue Aufgabe an.</p>
            </div>
          ) : null}

          {viewMode === "liste" ? (
            <div style={taskGridStyle}>
              {visibleTasks.map((task) => (
                <TaskListCard
                  key={task.id}
                  task={task}
                  onEdit={startEditTask}
                  onDelete={deleteTask}
                  highlight={lastMovedTaskId === task.id}
                />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div style={kanbanGridStyle}>
                {KANBAN_COLUMNS.map((column) => (
                  <KanbanColumn
                    key={column}
                    status={column}
                    tasks={tasksByStatus[column]}
                    onEdit={startEditTask}
                    onDelete={deleteTask}
                    highlightTaskId={lastMovedTaskId}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <div style={{ ...taskCardStyle, width: 300, cursor: "grabbing" }}>
                    <TaskBody task={activeTask} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </section>

        {isEditModalOpen ? (
          <div style={modalOverlayStyle} onClick={closeEditModal}>
            <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Aufgabe bearbeiten</h2>
                  <p style={helperTextStyle}>
                    Passe Titel, Beschreibung, Status, Priorität und Fälligkeitsdatum an.
                  </p>
                </div>

                <button type="button" style={modalCloseButtonStyle} onClick={closeEditModal}>
                  ✕
                </button>
              </div>

              <form onSubmit={updateTaskFromModal} style={formGridStyle}>
                <input
                  ref={editTitleInputRef}
                  style={inputStyle}
                  placeholder="Titel"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <input
                  style={inputStyle}
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />

                <select
                  style={inputStyle}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                >
                  <option value="offen">Offen</option>
                  <option value="in_bearbeitung">In Bearbeitung</option>
                  <option value="erledigt">Erledigt</option>
                </select>

                <select
                  style={inputStyle}
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                >
                  <option value="niedrig">Niedrig</option>
                  <option value="mittel">Mittel</option>
                  <option value="hoch">Hoch</option>
                </select>

                <textarea
                  style={{ ...inputStyle, minHeight: "120px", gridColumn: "1 / -1" }}
                  placeholder="Beschreibung"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />

                <div style={{ ...buttonRowStyle, gridColumn: "1 / -1" }}>
                  <button style={primaryButtonStyle} type="submit" disabled={isUpdatingTask}>
                    {isUpdatingTask ? "Speichert..." : "Änderungen speichern"}
                  </button>

                  <button style={secondaryButtonStyle} type="button" onClick={closeEditModal}>
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "erledigt") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function isDueToday(task: Task): boolean {
  if (!task.due_date || task.status === "erledigt") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);

  return due.getTime() === today.getTime();
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  onEdit,
  onDelete,
  highlightTaskId,
}: {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  highlightTaskId: number | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div ref={setNodeRef} style={{ ...kanbanColumnStyle, ...(isOver ? kanbanColumnActiveStyle : {}) }}>
      <div style={kanbanHeaderStyle}>
        <h3 style={kanbanTitleStyle}>{formatStatus(status)}</h3>
        <span style={columnCountStyle}>{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p style={helperTextStyle}>Keine Aufgaben</p>
      ) : (
        tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            highlight={highlightTaskId === task.id}
          />
        ))
      )}
    </div>
  );
}

function DraggableTaskCard({
  task,
  onEdit,
  onDelete,
  highlight,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  highlight: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
  });

  const style: CSSProperties = {
    ...taskCardStyle,
    ...(isOverdue(task)
      ? {
          border: "1px solid rgba(239, 68, 68, 0.45)",
          boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.12)",
        }
      : isDueToday(task)
      ? {
          border: "1px solid rgba(251, 191, 36, 0.45)",
          boxShadow: "0 0 0 2px rgba(251, 191, 36, 0.10)",
        }
      : {}),
    ...(highlight
      ? {
          boxShadow: "0 0 0 2px rgba(96, 165, 250, 0.12)",
        }
      : {}),
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <article ref={setNodeRef} style={style}>
      <div {...listeners} {...attributes} style={dragHandleStyle}>
        ⠿ Ziehen
      </div>
      <TaskBody task={task} />
      <div style={taskActionRowStyle}>
        <button style={secondaryButtonStyle} type="button" onClick={() => onEdit(task)}>
          Bearbeiten
        </button>
        <button style={deleteButtonStyle} type="button" onClick={() => onDelete(task.id)}>
          Löschen
        </button>
      </div>
    </article>
  );
}

function TaskListCard({
  task,
  onEdit,
  onDelete,
  highlight,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  highlight: boolean;
}) {
  return (
    <div
      style={{
        ...taskCardStyle,
        ...(isOverdue(task)
          ? {
              border: "1px solid rgba(239, 68, 68, 0.45)",
              boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.12)",
            }
          : isDueToday(task)
          ? {
              border: "1px solid rgba(251, 191, 36, 0.45)",
              boxShadow: "0 0 0 2px rgba(251, 191, 36, 0.10)",
            }
          : {}),
        ...(highlight
          ? {
              boxShadow: "0 0 0 2px rgba(96, 165, 250, 0.12)",
            }
          : {}),
      }}
    >
      <TaskBody task={task} />
      <div style={taskActionRowStyle}>
        <button style={secondaryButtonStyle} type="button" onClick={() => onEdit(task)}>
          Bearbeiten
        </button>
        <button style={deleteButtonStyle} type="button" onClick={() => onDelete(task.id)}>
          Löschen
        </button>
      </div>
    </div>
  );
}

function TaskBody({ task }: { task: Task }) {
  return (
    <>
      <div style={taskHeaderStyle}>
        <h3 style={taskTitleStyle}>{task.title}</h3>
        <span style={getStatusPillStyle(task.status)}>{formatStatus(task.status)}</span>
      </div>

      <p style={taskDescriptionStyle}>{task.description || "Keine Beschreibung vorhanden."}</p>

      <div style={metaRowStyle}>
        <span style={getPriorityPillStyle(task.priority)}>Priorität: {formatPriority(task.priority)}</span>

        <span
          style={{
            ...metaTextStyle,
            color: isOverdue(task) ? "#ff6b6b" : isDueToday(task) ? "#fde68a" : metaTextStyle.color,
            fontWeight: isOverdue(task) || isDueToday(task) ? "bold" : "normal",
          }}
        >
          Fällig: {task.due_date || "Kein Datum"}
          {isOverdue(task) ? " ⚠️ Überfällig" : isDueToday(task) ? " ⏰ Heute" : ""}
        </span>
      </div>
    </>
  );
}

function formatStatus(status: TaskStatus): string {
  if (status === "in_bearbeitung") return "🟡 In Bearbeitung";
  if (status === "erledigt") return "🟢 Erledigt";
  return "🔵 Offen";
}

function formatPriority(priority: TaskPriority): string {
  if (priority === "hoch") return "🔥 Hoch";
  if (priority === "mittel") return "⚠️ Mittel";
  return "🟢 Niedrig";
}

function getStatusPillStyle(status: TaskStatus): CSSProperties {
  if (status === "erledigt") {
    return {
      ...pillBaseStyle,
      background: "rgba(34,197,94,0.15)",
      color: "#86efac",
    };
  }
  if (status === "in_bearbeitung") {
    return {
      ...pillBaseStyle,
      background: "rgba(251,191,36,0.15)",
      color: "#fde68a",
    };
  }
  return {
    ...pillBaseStyle,
    background: "rgba(59,130,246,0.15)",
    color: "#93c5fd",
  };
}

function getPriorityPillStyle(priority: TaskPriority): CSSProperties {
  if (priority === "hoch") {
    return {
      ...pillBaseStyle,
      background: "rgba(239,68,68,0.15)",
      color: "#fca5a5",
    };
  }
  if (priority === "mittel") {
    return {
      ...pillBaseStyle,
      background: "rgba(251,191,36,0.15)",
      color: "#fde68a",
    };
  }
  return {
    ...pillBaseStyle,
    background: "rgba(34,197,94,0.15)",
    color: "#86efac",
  };
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 28%), radial-gradient(circle at top right, rgba(139,92,246,0.10), transparent 22%), linear-gradient(180deg, #0b1120 0%, #0f172a 42%, #111827 100%)",
  color: "#e5e7eb",
  padding: "32px 20px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const loginShellStyle: CSSProperties = {
  minHeight: "calc(100vh - 64px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const containerStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const loginCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  background: "rgba(15, 23, 42, 0.88)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
};

const heroCardStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.88)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
  marginBottom: "22px",
};

const heroHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(37, 99, 235, 0.16)",
  border: "1px solid rgba(96, 165, 250, 0.28)",
  color: "#bfdbfe",
  fontSize: "0.86rem",
  fontWeight: 700,
  marginBottom: "14px",
};

const heroTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "10px",
  color: "#f8fafc",
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  lineHeight: 1.08,
};

const heroTextStyle: CSSProperties = {
  color: "#cbd5e1",
  maxWidth: "760px",
  fontSize: "1.02rem",
  lineHeight: 1.7,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const statCardStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
};

const statLabelStyle: CSSProperties = {
  color: "#94a3b8",
  marginBottom: "8px",
  fontSize: "0.95rem",
};

const statValueStyle: CSSProperties = {
  color: "#f8fafc",
  fontSize: "2rem",
  fontWeight: 800,
};

const chartGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  marginBottom: "24px",
};

const chartCardStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
};

const chartTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
  color: "#93c5fd",
  fontSize: "1.15rem",
};

const chartBoxStyle: CSSProperties = {
  width: "100%",
  height: "300px",
};

const cardStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
  marginBottom: "24px",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "16px",
  color: "#93c5fd",
  fontSize: "1.45rem",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const filterRowStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(37, 99, 235, 0.24)",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "rgba(30, 41, 59, 0.85)",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
};

const deleteButtonStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.25)",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  cursor: "pointer",
  fontWeight: 600,
};

const errorStyle: CSSProperties = {
  color: "#fca5a5",
  background: "rgba(127, 29, 29, 0.18)",
  border: "1px solid rgba(248, 113, 113, 0.25)",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "16px",
};

const successStyle: CSSProperties = {
  color: "#86efac",
  background: "rgba(22, 101, 52, 0.22)",
  border: "1px solid rgba(74, 222, 128, 0.22)",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "16px",
};

const helperTextStyle: CSSProperties = {
  color: "#94a3b8",
};

const kanbanGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const kanbanColumnStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.55)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "18px",
  padding: "16px",
  minHeight: "360px",
};

const kanbanColumnActiveStyle: CSSProperties = {
  border: "1px solid rgba(96, 165, 250, 0.45)",
  boxShadow: "0 0 0 1px rgba(96, 165, 250, 0.12)",
  background: "rgba(30, 41, 59, 0.72)",
};

const kanbanHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
};

const kanbanTitleStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
};

const columnCountStyle: CSSProperties = {
  minWidth: "30px",
  height: "30px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(59, 130, 246, 0.15)",
  border: "1px solid rgba(59, 130, 246, 0.28)",
  color: "#93c5fd",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const taskGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const taskCardStyle: CSSProperties = {
  background: "rgba(30, 41, 59, 0.85)",
  borderRadius: "16px",
  padding: "18px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
  marginBottom: "12px",
};

const taskHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  marginBottom: "10px",
};

const taskTitleStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
};

const taskDescriptionStyle: CSSProperties = {
  color: "#cbd5e1",
  minHeight: "44px",
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const metaTextStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.92rem",
};

const taskActionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "14px",
  flexWrap: "wrap",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const dragHandleStyle: CSSProperties = {
  fontSize: "0.85rem",
  color: "#93c5fd",
  marginBottom: "10px",
  userSelect: "none",
};

const pillBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "0.82rem",
  fontWeight: 700,
};

const emptyStateStyle: CSSProperties = {
  border: "1px dashed rgba(148, 163, 184, 0.25)",
  borderRadius: "18px",
  padding: "28px",
  textAlign: "center",
  background: "rgba(15, 23, 42, 0.35)",
};

const emptyStateEmojiStyle: CSSProperties = {
  fontSize: "2rem",
  marginBottom: "10px",
};

const emptyStateTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "8px",
  color: "#e5e7eb",
};

const heroBadgeRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "16px",
};

const heroTechBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(30, 41, 59, 0.90)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  color: "#cbd5e1",
  fontSize: "0.88rem",
  fontWeight: 600,
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, 0.72)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "760px",
  background: "rgba(15, 23, 42, 0.98)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 24px 60px rgba(0,0,0,0.38)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "16px",
};

const modalCloseButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "12px",
  width: "40px",
  height: "40px",
  background: "rgba(30, 41, 59, 0.85)",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: 700,
};