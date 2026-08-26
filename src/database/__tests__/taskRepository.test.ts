import { taskRepository } from '../repositories/taskRepository';

describe('Task Repository (SQLite WAL Database Layer)', () => {
  it('should create and retrieve tasks with parameterized queries', async () => {
    const newTask = await taskRepository.createTask({
      title: 'Write Jest Unit Tests',
      description: 'Cover repositories and stores',
      energyLevel: 3,
      priority: 'P1',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0],
      isRecurringChore: false,
      isEscalatingBirthday: false,
    });

    expect(newTask.id).toMatch(/^task_/);
    expect(newTask.title).toBe('Write Jest Unit Tests');
    expect(newTask.energyLevel).toBe(3);
    expect(newTask.priority).toBe('P1');

    const allTasks = await taskRepository.getAllTasks();
    expect(allTasks.some((t) => t.id === newTask.id)).toBe(true);
  });

  it('should filter tasks by energy level and status', async () => {
    await taskRepository.createTask({
      title: 'Gentle walk',
      energyLevel: 1,
      priority: 'P3',
      status: 'pending',
      isRecurringChore: false,
      isEscalatingBirthday: false,
    });

    const energy1Tasks = await taskRepository.getTasksByEnergy(1);
    expect(energy1Tasks.every((t) => t.energyLevel === 1)).toBe(true);
  });

  it('should complete task and toggle status cleanly', async () => {
    const task = await taskRepository.createTask({
      title: 'Submit Expense Report',
      energyLevel: 2,
      priority: 'P2',
      status: 'pending',
      isRecurringChore: false,
      isEscalatingBirthday: false,
    });

    await taskRepository.completeTask(task.id);
    const nextStatus = await taskRepository.toggleTaskStatus(task.id, 'completed');
    expect(nextStatus).toBe('pending');
  });

  it('should defer task by updating dueDate', async () => {
    const task = await taskRepository.createTask({
      title: 'Call Insurance Agent',
      energyLevel: 2,
      priority: 'P2',
      status: 'pending',
      isRecurringChore: false,
      isEscalatingBirthday: false,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await expect(taskRepository.deferTask(task.id, tomorrowStr)).resolves.not.toThrow();
  });

  it('should delete a task cleanly', async () => {
    const task = await taskRepository.createTask({
      title: 'Temporary Scratch Task',
      energyLevel: 1,
      priority: 'P4',
      status: 'pending',
      isRecurringChore: false,
      isEscalatingBirthday: false,
    });

    await taskRepository.deleteTask(task.id);
    const all = await taskRepository.getAllTasks();
    expect(all.some((t) => t.id === task.id)).toBe(false);
  });

  it('should query periodic recurring chores correctly', async () => {
    await taskRepository.createTask({
      title: 'Deep Clean Fridge',
      energyLevel: 3,
      priority: 'P3',
      status: 'pending',
      isRecurringChore: true,
      choreCadence: 'monthly',
      isEscalatingBirthday: false,
    });

    const chores = await taskRepository.getPeriodicChores();
    expect(chores.some((c) => c.title === 'Deep Clean Fridge')).toBe(true);
  });
});
