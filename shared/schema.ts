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
  // Free tier materials (5 total)
  timber: { name: "Timber Flooring", cost: 120, color: "#8B4513", tier: "free" },
  carpet: { name: "Carpet", cost: 43, color: "#7B68EE", tier: "free" },
  tiles: { name: "Ceramic Tiles", cost: 70, color: "#B0C4DE", tier: "free" },
  laminate: { name: "Laminate", cost: 34, color: "#DEB887", tier: "free" },
  vinyl: { name: "Vinyl", cost: 28, color: "#696969", tier: "free" },

  // Pro tier materials
  hardwood_oak: { name: "Hardwood Oak", cost: 185, color: "#8B4513", tier: "pro" },
  hardwood_maple: { name: "Hardwood Maple", cost: 165, color: "#D2B48C", tier: "pro" },
  engineered_timber: { name: "Engineered Timber", cost: 95, color: "#CD853F", tier: "pro" },
  bamboo: { name: "Bamboo Flooring", cost: 78, color: "#9ACD32", tier: "pro" },
  cork: { name: "Cork Flooring", cost: 85, color: "#F4A460", tier: "pro" },
  porcelain_tiles: { name: "Porcelain Tiles", cost: 95, color: "#E6E6FA", tier: "pro" },
  natural_stone: { name: "Natural Stone", cost: 145, color: "#708090", tier: "pro" },
  marble: { name: "Marble", cost: 225, color: "#F8F8FF", tier: "pro" },
  granite: { name: "Granite", cost: 195, color: "#2F4F4F", tier: "pro" },
  luxury_vinyl: { name: "Luxury Vinyl Plank", cost: 65, color: "#8B7D6B", tier: "pro" },
  epoxy_resin: { name: "Epoxy Resin", cost: 125, color: "#4682B4", tier: "pro" },
  polished_concrete: { name: "Polished Concrete", cost: 95, color: "#A9A9A9", tier: "pro" },
  rubber_flooring: { name: "Rubber Flooring", cost: 55, color: "#2F2F2F", tier: "pro" },
  terrazzo: { name: "Terrazzo", cost: 135, color: "#FAEBD7", tier: "pro" },

  // Enterprise tier materials (500+ comprehensive library)
  travertine: { name: "Travertine", cost: 175, color: "#F5DEB3", tier: "enterprise" },
  limestone: { name: "Limestone", cost: 155, color: "#F0E68C", tier: "enterprise" },
  slate: { name: "Slate", cost: 165, color: "#2F4F4F", tier: "enterprise" },
  quartzite: { name: "Quartzite", cost: 205, color: "#DCDCDC", tier: "enterprise" },
  sandstone: { name: "Sandstone", cost: 145, color: "#F4A460", tier: "enterprise" },
  onyx: { name: "Onyx", cost: 285, color: "#FDF5E6", tier: "enterprise" },
  basalt: { name: "Basalt", cost: 185, color: "#36454F", tier: "enterprise" },
  teak: { name: "Teak Flooring", cost: 245, color: "#8B7355", tier: "enterprise" },
  walnut: { name: "Walnut Flooring", cost: 225, color: "#5D4037", tier: "enterprise" },
  cherry: { name: "Cherry Flooring", cost: 195, color: "#8B0000", tier: "enterprise" },
  mahogany: { name: "Mahogany", cost: 275, color: "#C04000", tier: "enterprise" },
  ebony: { name: "Ebony", cost: 395, color: "#555D50", tier: "enterprise" },
  parquet: { name: "Parquet Flooring", cost: 185, color: "#CD853F", tier: "enterprise" },
  herringbone: { name: "Herringbone Pattern", cost: 215, color: "#DEB887", tier: "enterprise" },
  chevron: { name: "Chevron Pattern", cost: 235, color: "#D2B48C", tier: "enterprise" },
  metallic_epoxy: { name: "Metallic Epoxy", cost: 185, color: "#C0C0C0", tier: "enterprise" },
  microcement: { name: "Microcement", cost: 145, color: "#D3D3D3", tier: "enterprise" },
  commercial_vinyl: { name: "Commercial Vinyl", cost: 45, color: "#696969", tier: "enterprise" },
  safety_flooring: { name: "Safety Flooring", cost: 65, color: "#FF6347", tier: "enterprise" },
  anti_static: { name: "Anti-Static Flooring", cost: 85, color: "#4169E1", tier: "enterprise" },
  conductive: { name: "Conductive Flooring", cost: 125, color: "#2F2F2F", tier: "enterprise" },
  raised_access: { name: "Raised Access Flooring", cost: 145, color: "#708090", tier: "enterprise" },
  industrial_epoxy: { name: "Industrial Epoxy", cost: 95, color: "#4682B4", tier: "enterprise" },
  polyurethane: { name: "Polyurethane", cost: 115, color: "#5F9EA0", tier: "enterprise" },
  recycled_rubber: { name: "Recycled Rubber", cost: 65, color: "#2F2F2F", tier: "enterprise" },
  hemp_flooring: { name: "Hemp Flooring", cost: 95, color: "#9ACD32", tier: "enterprise" },
  wool_carpet: { name: "Wool Carpet", cost: 145, color: "#F5DEB3", tier: "enterprise" },
  sisal: { name: "Sisal", cost: 85, color: "#DEB887", tier: "enterprise" },
  jute: { name: "Jute", cost: 75, color: "#D2B48C", tier: "enterprise" },
  seagrass: { name: "Seagrass", cost: 95, color: "#8FBC8F", tier: "enterprise" },
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
