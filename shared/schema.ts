import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // free, pro, premium
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  projectsThisMonth: integer("projects_this_month").notNull().default(0),
  lastProjectReset: timestamp("last_project_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  location: text("location"),
  rooms: text("rooms").notNull(), // JSON string of room data
  totalCost: real("total_cost").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  material: text("material").notNull(),
  cost: real("cost").notNull(),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  projectsThisMonth: true,
  lastProjectReset: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Material types for type safety
export const MATERIALS = {
  timber: { name: "Timber", cost: 100, color: "#D97706" },
  carpet: { name: "Carpet", cost: 40, color: "#3B82F6" },
  tiles: { name: "Tiles", cost: 60, color: "#6B7280" },
  laminate: { name: "Laminate", cost: 30, color: "#CA8A04" },
  vinyl: { name: "Vinyl", cost: 25, color: "#10B981" },
} as const;

export type MaterialType = keyof typeof MATERIALS;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one }) => ({
  project: one(projects, {
    fields: [rooms.projectId],
    references: [projects.id],
  }),
}));
