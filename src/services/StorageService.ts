import localforage from 'localforage';

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
      projects.push(value);
    });
    return projects;
  }

  async deleteProject(id: string): Promise<void> {
    await this.projectStore.removeItem(id);
    const tasks = await this.getTasksByProject(id);
    for (const task of tasks) {
      await this.deleteTask(task.id);
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
      if (value.projectId === projectId) {
        tasks.push(value);
      }
    });
    return tasks;
  }

  async deleteTask(id: string): Promise<void> {
    await this.taskStore.removeItem(id);
  }

  async searchTasks(query: string, projectId?: string): Promise<Task[]> {
    const tasks: Task[] = [];
    const lowerCaseQuery = query.toLowerCase();

    await this.taskStore.iterate((value: Task) => {
      if (
        (!projectId || value.projectId === projectId) &&
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
