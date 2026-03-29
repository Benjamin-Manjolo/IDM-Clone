import React, { useState } from 'react';
import { useScheduler } from '../hooks/useScheduler';
import { formatScheduleDescription } from '@idm/scheduler';
import type { SchedulerTask } from '@idm/shared';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultTask = (): Omit<SchedulerTask, 'id' | 'createdAt'> => ({
  name: '',
  repeat: 'once',
  onStart: 'start',
  onStop: 'stop',
  enabled: true,
  daysOfWeek: [],
});

export const Scheduler: React.FC = () => {
  const { tasks, create, update, remove, toggle } = useScheduler();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultTask());
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');

  const patch = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    let startTimestamp: number | undefined;
    if (startDate) {
      startTimestamp = new Date(`${startDate}T${startTime}`).getTime();
    }
    await create({ ...form, startTime: startTimestamp });
    setForm(defaultTask()); setStartDate(''); setStartTime('08:00'); setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Scheduler</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Schedule downloads to start, stop, or shutdown at specific times
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
            <span className="text-5xl">🕐</span>
            <p className="text-sm font-medium">No scheduled tasks</p>
            <p className="text-xs">Automate downloads — start at night, shutdown when done</p>
          </div>
        )}

        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onToggle={toggle} onRemove={remove} />
        ))}

        {showForm && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-950/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Scheduled Task</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input autoFocus type="text" value={form.name} onChange={e => patch({ name: e.target.value })}
                placeholder="Task name..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="grid grid-cols-2 gap-3">
                {/* Repeat */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Repeat</label>
                  <select value={form.repeat} onChange={e => patch({ repeat: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom interval</option>
                  </select>
                </div>
                {/* On start action */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">On start</label>
                  <select value={form.onStart} onChange={e => patch({ onStart: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="start">Start downloads</option>
                    <option value="stop">Stop downloads</option>
                  </select>
                </div>
              </div>

              {/* Weekly days */}
              {form.repeat === 'weekly' && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Days of week</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((d, i) => (
                      <button key={d} type="button"
                        onClick={() => {
                          const days = form.daysOfWeek ?? [];
                          patch({ daysOfWeek: days.includes(i) ? days.filter(x => x !== i) : [...days, i] });
                        }}
                        className={`px-2 py-1 text-xs rounded-md border font-medium transition-colors ${
                          (form.daysOfWeek ?? []).includes(i)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}>{d}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom interval */}
              {form.repeat === 'custom' && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Interval (minutes)</label>
                  <input type="number" min={1} defaultValue={60}
                    onChange={e => patch({ intervalMs: +e.target.value * 60000 })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {/* Date + time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {form.repeat === 'once' ? 'Date' : 'Start date (optional)'}
                  </label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* On stop action */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">When done (optional)</label>
                <select value={form.onStop ?? ''} onChange={e => patch({ onStop: e.target.value as any || undefined })}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Do nothing</option>
                  <option value="stop">Stop downloads</option>
                  <option value="shutdown">Shutdown computer</option>
                  <option value="hibernate">Hibernate</option>
                  <option value="sleep">Sleep</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setForm(defaultTask()); }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={!form.name.trim()}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium">Create Task</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: SchedulerTask; onToggle: (id: string) => void; onRemove: (id: string) => void }> = ({ task, onToggle, onRemove }) => (
  <div className={`border rounded-xl p-4 ${task.enabled ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{task.name}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${task.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
            {task.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatScheduleDescription(task)}</p>
        {task.nextRunAt && <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Next: {new Date(task.nextRunAt).toLocaleString()}</p>}
        {task.onStop && <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">After: {task.onStop}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => onToggle(task.id)}
          className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {task.enabled ? 'Disable' : 'Enable'}
        </button>
        <button onClick={() => onRemove(task.id)}
          className="px-2.5 py-1 text-xs border border-red-200 dark:border-red-900 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
          Remove
        </button>
      </div>
    </div>
  </div>
);
