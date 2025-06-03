
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  createdAt: string;
  completed: boolean;
  quadrant: 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';
  projectId: string;
  order?: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
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
    this.db = await openDB<TaskMatrixDB>('TaskMatrixDB', 1, {
      upgrade(db) {
        // Create projects store
        db.createObjectStore('projects', { keyPath: 'id' });

        // Create tasks store with indexes
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tasksStore.createIndex('by-project', 'projectId');
        tasksStore.createIndex('by-quadrant', ['projectId', 'quadrant']);
      },
    });
  }

  async getAllProjects(): Promise<Project[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('projects');
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
    return this.db!.getAllFromIndex('tasks', 'by-project', projectId);
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
    
    const lowerQuery = query.toLowerCase();
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

export const storageService = new StorageService();
