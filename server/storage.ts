import { users, projects, rooms, type User, type InsertUser, type Project, type InsertProject, type Room, type InsertRoom } from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: number, tier: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User>;
  incrementUserProjects(id: number): Promise<void>;
  resetUserProjectsIfNeeded(id: number): Promise<void>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Room operations
  getProjectRooms(projectId: number): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;
  deleteProjectRooms(projectId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private rooms: Map<number, Room>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentRoomId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.rooms = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentRoomId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      subscriptionTier: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      projectsThisMonth: 0,
      lastProjectReset: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserSubscription(id: number, tier: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      subscriptionTier: tier,
      stripeCustomerId: stripeCustomerId || user.stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId || user.stripeSubscriptionId,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async incrementUserProjects(id: number): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      projectsThisMonth: user.projectsThisMonth + 1,
    };
    this.users.set(id, updatedUser);
  }

  async resetUserProjectsIfNeeded(id: number): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const now = new Date();
    const lastReset = user.lastProjectReset;
    if (lastReset && now.getMonth() !== lastReset.getMonth()) {
      const updatedUser: User = {
        ...user,
        projectsThisMonth: 0,
        lastProjectReset: now,
      };
      this.users.set(id, updatedUser);
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      id,
      location: insertProject.location || null,
      totalCost: insertProject.totalCost || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    
    const updatedProject: Project = {
      ...project,
      ...projectUpdate,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
    // Also delete associated rooms
    await this.deleteProjectRooms(id);
  }

  async getProjectRooms(projectId: number): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.projectId === projectId);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = {
      ...insertRoom,
      id,
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: number, roomUpdate: Partial<InsertRoom>): Promise<Room> {
    const room = this.rooms.get(id);
    if (!room) throw new Error("Room not found");
    
    const updatedRoom: Room = {
      ...room,
      ...roomUpdate,
    };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<void> {
    this.rooms.delete(id);
  }

  async deleteProjectRooms(projectId: number): Promise<void> {
    const roomsToDelete = Array.from(this.rooms.values()).filter(room => room.projectId === projectId);
    roomsToDelete.forEach(room => this.rooms.delete(room.id));
  }
}

import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import * as schema from "@shared/schema";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserSubscription(id: number, tier: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(schema.users)
      .set({
        subscriptionTier: tier,
        stripeCustomerId,
        stripeSubscriptionId,
      })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async incrementUserProjects(id: number): Promise<void> {
    await db
      .update(schema.users)
      .set({
        projectsThisMonth: sql`${schema.users.projectsThisMonth} + 1`,
      })
      .where(eq(schema.users.id, id));
  }

  async resetUserProjectsIfNeeded(id: number): Promise<void> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (user && user.lastProjectReset) {
      const now = new Date();
      const lastReset = new Date(user.lastProjectReset);
      const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
      
      if (monthsDiff >= 1) {
        await db
          .update(schema.users)
          .set({
            projectsThisMonth: 0,
            lastProjectReset: now,
          })
          .where(eq(schema.users.id, id));
      }
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    return project || undefined;
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    return await db.select().from(schema.projects).where(eq(schema.projects.userId, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(schema.projects)
      .values({
        ...insertProject,
        updatedAt: new Date(),
      })
      .returning();
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(schema.projects)
      .set({
        ...projectUpdate,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
  }

  async getProjectRooms(projectId: number): Promise<Room[]> {
    return await db.select().from(schema.rooms).where(eq(schema.rooms.projectId, projectId));
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(schema.rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async updateRoom(id: number, roomUpdate: Partial<InsertRoom>): Promise<Room> {
    const [room] = await db
      .update(schema.rooms)
      .set(roomUpdate)
      .where(eq(schema.rooms.id, id))
      .returning();
    return room;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(schema.rooms).where(eq(schema.rooms.id, id));
  }

  async deleteProjectRooms(projectId: number): Promise<void> {
    await db.delete(schema.rooms).where(eq(schema.rooms.projectId, projectId));
  }
}

export const storage = new DatabaseStorage();
