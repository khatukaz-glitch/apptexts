import { useState, useEffect, useCallback } from 'react';

// Telegram Web App type declarations
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'light' | 'dark';
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        sendData: (data: string) => void;
      };
    };
  }
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

type View = 'list' | 'add' | 'stats';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tg-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<View>('list');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [userName, setUserName] = useState('User');
  const [isTelegram, setIsTelegram] = useState(false);

  // Initialize Telegram Web App
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setIsTelegram(true);
      if (tg.initDataUnsafe?.user) {
        setUserName(tg.initDataUnsafe.user.first_name);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('tg-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Haptic feedback helper
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' = 'light') => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (type === 'success' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  }, []);

  // Main Button logic
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleMainButton = () => {
      if (view === 'add' && newTaskText.trim()) {
        addTask();
      }
    };

    tg.MainButton.onClick(handleMainButton);
    return () => {
      tg.MainButton.offClick(handleMainButton);
    };
  }, [view, newTaskText, newTaskPriority]);

  // Update Main Button visibility
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    if (view === 'add') {
      tg.MainButton.setParams({
        text: '✓ Add Task',
        is_visible: true,
        is_active: newTaskText.trim().length > 0,
      });
    } else {
      tg.MainButton.hide();
    }
  }, [view, newTaskText]);

  // Back button logic
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBack = () => {
      setView('list');
    };

    tg.BackButton.onClick(handleBack);

    if (view !== 'list') {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [view]);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const task: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskText('');
    setNewTaskPriority('medium');
    haptic('success');
    setView('list');
  };

  const toggleTask = (id: number) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    haptic('selection');
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    haptic('medium');
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.filter(t => !t.completed).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'fa-arrow-up';
      case 'medium': return 'fa-minus';
      case 'low': return 'fa-arrow-down';
      default: return 'fa-minus';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color, #ffffff)] text-[var(--tg-theme-text-color, #000000)] transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-[var(--tg-theme-bg-color, #ffffff)]/80 border-b border-[var(--tg-theme-hint-color, #999999)]/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold">Hello, {userName}!</h1>
              <p className="text-xs text-[var(--tg-theme-hint-color, #999999)]">
                {activeCount} task{activeCount !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          <button
            onClick={() => { haptic('light'); setView('stats'); }}
            className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] flex items-center justify-center active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-chart-pie text-[var(--tg-theme-link-color, #2481cc)]"></i>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 pb-24">
        {view === 'list' && (
          <>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { haptic('selection'); setFilter(f); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-[var(--tg-theme-button-color, #2481cc)] text-[var(--tg-theme-button-text-color, #ffffff)]'
                      : 'bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] text-[var(--tg-theme-text-color, #000000)]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'all' && ` (${tasks.length})`}
                  {f === 'active' && ` (${activeCount})`}
                  {f === 'completed' && ` (${completedCount})`}
                </button>
              ))}
            </div>

            {/* Task list */}
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] flex items-center justify-center mb-4">
                  <i className="fa-solid fa-clipboard-list text-3xl text-[var(--tg-theme-hint-color, #999999)]"></i>
                </div>
                <p className="text-[var(--tg-theme-hint-color, #999999)] text-lg font-medium">
                  {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
                </p>
                <p className="text-[var(--tg-theme-hint-color, #999999)] text-sm mt-1">
                  {filter === 'all' ? 'Tap + to create your first task' : 'Try a different filter'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] transition-all active:scale-[0.98] ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        task.completed
                          ? 'bg-[var(--tg-theme-button-color, #2481cc)] border-[var(--tg-theme-button-color, #2481cc)]'
                          : 'border-[var(--tg-theme-hint-color, #999999)]/40'
                      }`}
                    >
                      {task.completed && (
                        <i className="fa-solid fa-check text-white text-xs"></i>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <i className={`fa-solid ${getPriorityIcon(task.priority)} ${getPriorityColor(task.priority)} text-xs`}></i>
                        <span className="text-xs text-[var(--tg-theme-hint-color, #999999)]">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'add' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">New Task</h2>
            
            <div>
              <label className="text-sm font-medium text-[var(--tg-theme-hint-color, #999999)] mb-2 block">
                What needs to be done?
              </label>
              <textarea
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Enter task description..."
                className="w-full p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] border-none outline-none resize-none text-[var(--tg-theme-text-color, #000000)] placeholder:text-[var(--tg-theme-hint-color, #999999)]/60"
                rows={3}
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--tg-theme-hint-color, #999999)] mb-2 block">
                Priority
              </label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { haptic('selection'); setNewTaskPriority(p); }}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                      newTaskPriority === p
                        ? p === 'high'
                          ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500'
                          : p === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-500 ring-2 ring-yellow-500'
                          : 'bg-green-500/20 text-green-500 ring-2 ring-green-500'
                        : 'bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] text-[var(--tg-theme-text-color, #000000)]'
                    }`}
                  >
                    <i className={`fa-solid ${getPriorityIcon(p)}`}></i>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile add button (for non-Telegram environments) */}
            {!isTelegram && (
              <button
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="w-full py-4 rounded-2xl bg-[var(--tg-theme-button-color, #2481cc)] text-[var(--tg-theme-button-text-color, #ffffff)] font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                ✓ Add Task
              </button>
            )}
          </div>
        )}

        {view === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Statistics</h2>
            
            {/* Progress ring */}
            <div className="flex justify-center py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--tg-theme-secondary-bg-color, #f0f0f0)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--tg-theme-button-color, #2481cc)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${tasks.length ? (completedCount / tasks.length) * 264 : 0} 264`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">
                    {tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%
                  </span>
                  <span className="text-xs text-[var(--tg-theme-hint-color, #999999)]">completed</span>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] text-center">
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-xs text-[var(--tg-theme-hint-color, #999999)] mt-1">Total</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] text-center">
                <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                <p className="text-xs text-[var(--tg-theme-hint-color, #999999)] mt-1">Done</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)] text-center">
                <p className="text-2xl font-bold text-blue-500">{activeCount}</p>
                <p className="text-xs text-[var(--tg-theme-hint-color, #999999)] mt-1">Active</p>
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)]">
              <h3 className="font-bold mb-3">By Priority</h3>
              {(['high', 'medium', 'low'] as const).map(p => {
                const count = tasks.filter(t => t.priority === p).length;
                const pct = tasks.length ? (count / tasks.length) * 100 : 0;
                return (
                  <div key={p} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <i className={`fa-solid ${getPriorityIcon(p)} ${getPriorityColor(p)}`}></i>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                      <span className="text-[var(--tg-theme-hint-color, #999999)]">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--tg-theme-bg-color, #ffffff)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Telegram info */}
            {isTelegram && (
              <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color, #f0f0f0)]">
                <h3 className="font-bold mb-2">App Info</h3>
                <p className="text-sm text-[var(--tg-theme-hint-color, #999999)]">
                  <i className="fa-solid fa-circle-check text-green-500 mr-2"></i>
                  Running in Telegram
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color, #999999)] mt-1">
                  <i className="fa-solid fa-palette text-blue-500 mr-2"></i>
                  Theme: {window.Telegram?.WebApp?.colorScheme || 'unknown'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color, #ffffff)]/90 backdrop-blur-lg border-t border-[var(--tg-theme-hint-color, #999999)]/20 px-4 py-2 pb-4 z-20">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => { haptic('selection'); setView('list'); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              view === 'list' ? 'text-[var(--tg-theme-button-color, #2481cc)]' : 'text-[var(--tg-theme-hint-color, #999999)]'
            }`}
          >
            <i className="fa-solid fa-list-check text-xl"></i>
            <span className="text-[10px] font-medium">Tasks</span>
          </button>
          
          <button
            onClick={() => { haptic('medium'); setView('add'); }}
            className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-transform"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>

          <button
            onClick={() => { haptic('selection'); setView('stats'); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              view === 'stats' ? 'text-[var(--tg-theme-button-color, #2481cc)]' : 'text-[var(--tg-theme-hint-color, #999999)]'
            }`}
          >
            <i className="fa-solid fa-chart-pie text-xl"></i>
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
