
import localforage from 'localforage';

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  deadline?: string;
  deadlineTime?: string;
  quadrant: 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';
  projectId: string;
  archived?: boolean;
  order?: number;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  archived?: boolean;
  order?: number;
}

class StorageService {
  private taskStore: LocalForage;
  private projectStore: LocalForage;

  constructor() {
    this.taskStore = localforage.createInstance({
      name: 'taskStore'
    });
    this.projectStore = localforage.createInstance({
      name: 'projectStore'
    });
  }

  // Projects
  async saveProject(project: Project): Promise<void> {
    await this.projectStore.setItem(project.id, project);
  }

  async getProject(id: string): Promise<Project | null> {
    return await this.projectStore.getItem(id);
  }

  async getAllProjects(): Promise<Project[]> {
    const projects: Project[] = [];
    await this.projectStore.iterate((value: Project) => {
      if (!value.archived) {
        projects.push(value);
      }
    });
    return projects.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getArchivedProjects(): Promise<Project[]> {
    const projects: Project[] = [];
    await this.projectStore.iterate((value: Project) => {
      if (value.archived) {
        projects.push(value);
      }
    });
    return projects;
  }

  async archiveProject(id: string): Promise<void> {
    const project = await this.getProject(id);
    if (project) {
      await this.saveProject({ ...project, archived: true });
    }
  }

  async restoreProject(id: string): Promise<void> {
    const project = await this.getProject(id);
    if (project) {
      await this.saveProject({ ...project, archived: false });
    }
  }

  async deleteProject(id: string): Promise<void> {
    await this.projectStore.removeItem(id);
    const tasks = await this.getTasksByProject(id);
    for (const task of tasks) {
      await this.deleteTask(task.id);
    }
  }

  async permanentDeleteProject(id: string): Promise<void> {
    await this.projectStore.removeItem(id);
    // Also permanently delete all tasks in this project
    const allTasks: Task[] = [];
    await this.taskStore.iterate((value: Task) => {
      if (value.projectId === id) {
        allTasks.push(value);
      }
    });
    for (const task of allTasks) {
      await this.taskStore.removeItem(task.id);
    }
  }

  async updateProjectOrder(projectId: string, newOrder: number): Promise<void> {
    const project = await this.getProject(projectId);
    if (project) {
      await this.saveProject({ ...project, order: newOrder });
    }
  }

  // Tasks
  async saveTask(task: Task): Promise<void> {
    await this.taskStore.setItem(task.id, task);
  }

  async getTask(id: string): Promise<Task | null> {
    return await this.taskStore.getItem(id);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasks: Task[] = [];
    await this.taskStore.iterate((value: Task) => {
      if (value.projectId === projectId && !value.archived) {
        tasks.push(value);
      }
    });
    return tasks;
  }

  async getArchivedTasks(): Promise<Task[]> {
    const tasks: Task[] = [];
    await this.taskStore.iterate((value: Task) => {
      if (value.archived) {
        tasks.push(value);
      }
    });
    return tasks;
  }

  async archiveTask(id: string): Promise<void> {
    const task = await this.getTask(id);
    if (task) {
      await this.saveTask({ ...task, archived: true });
    }
  }

  async restoreTask(id: string): Promise<void> {
    const task = await this.getTask(id);
    if (task) {
      await this.saveTask({ ...task, archived: false });
    }
  }

  async deleteTask(id: string): Promise<void> {
    await this.taskStore.removeItem(id);
  }

  async permanentDeleteTask(id: string): Promise<void> {
    await this.taskStore.removeItem(id);
  }

  async searchTasks(query: string, projectId?: string): Promise<Task[]> {
    const tasks: Task[] = [];
    const lowerCaseQuery = query.toLowerCase();

    await this.taskStore.iterate((value: Task) => {
      if (
        (!projectId || value.projectId === projectId) &&
        !value.archived &&
        (value.title.toLowerCase().includes(lowerCaseQuery) ||
          (value.description && value.description.toLowerCase().includes(lowerCaseQuery)))
      ) {
        tasks.push(value);
      }
    });

    return tasks;
  }

  async createRecurringTask(originalTask: Task): Promise<Task> {
    const newTask: Task = {
      ...originalTask,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    await this.saveTask(newTask);
    return newTask;
  }
}

export const storageService = new StorageService();
