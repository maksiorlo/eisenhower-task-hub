import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';
  interval?: number; // for every X days
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  deadlineTime?: string; // HH:MM format
  createdAt: string;
  completed: boolean;
  quadrant: 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';
  projectId: string;
  order?: number;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  archived?: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  archived?: boolean;
}

interface TaskMatrixDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-project': string; 'by-quadrant': string };
  };
}

class StorageService {
  private db: IDBPDatabase<TaskMatrixDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<TaskMatrixDB>('TaskMatrixDB', 2, {
      upgrade(db, oldVersion) {
        // Create projects store
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        // Create tasks store with indexes
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('by-project', 'projectId');
          tasksStore.createIndex('by-quadrant', ['projectId', 'quadrant']);
        }
      },
    });
  }

  async getAllProjects(): Promise<Project[]> {
    if (!this.db) await this.init();
    const projects = await this.db!.getAll('projects');
    return projects.filter(project => !project.archived);
  }

  async getArchivedProjects(): Promise<Project[]> {
    if (!this.db) await this.init();
    const projects = await this.db!.getAll('projects');
    return projects.filter(project => project.archived);
  }

  async archiveProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    const project = await this.getProject(id);
    if (project) {
      project.archived = true;
      await this.saveProject(project);
    }
  }

  async restoreProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    const project = await this.db!.get('projects', id);
    if (project) {
      project.archived = false;
      await this.saveProject(project);
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    if (!this.db) await this.init();
    return this.db!.get('projects', id);
  }

  async saveProject(project: Project): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('projects', project);
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    // Delete all tasks in this project
    const tasks = await this.getTasksByProject(id);
    for (const task of tasks) {
      await this.db!.delete('tasks', task.id);
    }
    // Delete the project
    await this.db!.delete('projects', id);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    if (!this.db) await this.init();
    const tasks = await this.db!.getAllFromIndex('tasks', 'by-project', projectId);
    return tasks.filter(task => !task.archived);
  }

  async getArchivedTasks(): Promise<Task[]> {
    if (!this.db) await this.init();
    const tasks = await this.db!.getAll('tasks');
    return tasks.filter(task => task.archived);
  }

  async archiveTask(id: string): Promise<void> {
    if (!this.db) await this.init();
    const task = await this.db!.get('tasks', id);
    if (task) {
      task.archived = true;
      await this.saveTask(task);
    }
  }

  async restoreTask(id: string): Promise<void> {
    if (!this.db) await this.init();
    const task = await this.db!.get('tasks', id);
    if (task) {
      task.archived = false;
      await this.saveTask(task);
    }
  }

  async getTasksByQuadrant(projectId: string, quadrant: Task['quadrant']): Promise<Task[]> {
    if (!this.db) await this.init();
    const allTasks = await this.getTasksByProject(projectId);
    return allTasks
      .filter(task => task.quadrant === quadrant)
      .sort((a, b) => {
        // Sort by deadline (closest first), then by creation date
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async saveTask(task: Task): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('tasks', task);
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('tasks', id);
  }

  async searchTasks(query: string, projectId?: string): Promise<Task[]> {
    if (!this.db) await this.init();
    const allTasks = projectId 
      ? await this.getTasksByProject(projectId)
      : await this.db!.getAll('tasks');
    
    const lowerQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return allTasks.filter(task => 
      !task.archived && (
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
      )
    );
  }

  async createRecurringTask(originalTask: Task): Promise<Task> {
    if (!originalTask.isRecurring || !originalTask.recurrencePattern) {
      throw new Error('Task is not recurring');
    }

    const pattern = originalTask.recurrencePattern;
    const now = new Date();
    let nextDate = new Date(now);

    switch (pattern.type) {
      case 'daily':
        nextDate.setDate(now.getDate() + (pattern.interval || 1));
        break;
      case 'weekly':
        nextDate.setDate(now.getDate() + 7);
        break;
      case 'weekdays':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case 'weekends':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6);
        break;
      case 'custom':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const testDate = new Date(now);
            testDate.setDate(now.getDate() + i);
            if (pattern.daysOfWeek.includes(testDate.getDay())) {
              nextDate = testDate;
              found = true;
              break;
            }
          }
          if (!found) {
            nextDate.setDate(now.getDate() + 7);
          }
        }
        break;
    }

    const newTask: Task = {
      ...originalTask,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
      deadline: nextDate.toISOString().split('T')[0]
    };

    await this.saveTask(newTask);
    return newTask;
  }
}

export const storageService = new StorageService();
