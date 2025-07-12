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
  
  // Expanded with AU/Global 2025 data (samples from ABS, Altus, RSMeans)
  structural_steel: { name: "Structural Steel", cost: 2500, unit: "tonne", color: "#A9A9A9", tier: "enterprise", ecoRating: 6, source: "Altus Q1 2025 (up 2-3%)" },
  concrete_ready_mix: { name: "Ready-Mix Concrete", cost: 150, unit: "m³", color: "#808080", tier: "pro", ecoRating: 5, source: "RSMeans 2025 sample" },
  softwood_timber: { name: "Softwood Timber", cost: 1200, unit: "m³", color: "#8B4513", tier: "free", ecoRating: 8, source: "ABS PPI March 2025 (-2.9% structural)" },
  hardwood_timber: { name: "Hardwood Timber", cost: 1850, unit: "m³", color: "#8B4513", tier: "pro", ecoRating: 7, source: "Rawlinsons 2025" },
  reinforcing_steel: { name: "Reinforcing Steel", cost: 1400, unit: "tonne", color: "#A9A9A9", tier: "enterprise", ecoRating: 4, source: "Compass Global 2025" },
  bricks_clay: { name: "Clay Bricks", cost: 800, unit: "thousand", color: "#B22222", tier: "pro", ecoRating: 5, source: "Altus Q1 2025 (steady)" },
  gypsum_board: { name: "Gypsum Board", cost: 12, unit: "m²", color: "#F5F5F5", tier: "free", ecoRating: 6, source: "RSMeans 2025" },
  insulation_fiberglass: { name: "Fiberglass Insulation", cost: 8, unit: "m²", color: "#FFD700", tier: "enterprise", ecoRating: 7, source: "Global benchmarks" },
  
  // Structural Materials
  concrete_precast: { name: "Precast Concrete", cost: 320, unit: "m³", color: "#808080", tier: "pro", ecoRating: 6, source: "Rawlinsons 2025" },
  concrete_tilt_up: { name: "Tilt-up Concrete", cost: 285, unit: "m³", color: "#696969", tier: "enterprise", ecoRating: 6, source: "ABS Q1 2025" },
  steel_beams: { name: "Steel Beams", cost: 2800, unit: "tonne", color: "#4682B4", tier: "pro", ecoRating: 5, source: "Altus 2025" },
  steel_columns: { name: "Steel Columns", cost: 2600, unit: "tonne", color: "#5F9EA0", tier: "pro", ecoRating: 5, source: "Altus 2025" },
  timber_glulam: { name: "Glulam Beams", cost: 2200, unit: "m³", color: "#DEB887", tier: "enterprise", ecoRating: 9, source: "Rawlinsons 2025" },
  timber_clt: { name: "Cross Laminated Timber", cost: 1600, unit: "m³", color: "#D2691E", tier: "enterprise", ecoRating: 9, source: "ABS PPI 2025" },
  concrete_blocks: { name: "Concrete Blocks", cost: 45, unit: "m²", color: "#A9A9A9", tier: "free", ecoRating: 5, source: "RSMeans 2025" },
  aac_blocks: { name: "AAC Blocks", cost: 65, unit: "m²", color: "#F5F5F5", tier: "pro", ecoRating: 7, source: "Global benchmarks" },
  
  // Wall Systems
  curtain_wall_glass: { name: "Glass Curtain Wall", cost: 650, unit: "m²", color: "#87CEEB", tier: "enterprise", ecoRating: 4, source: "Altus 2025" },
  curtain_wall_aluminium: { name: "Aluminium Curtain Wall", cost: 580, unit: "m²", color: "#C0C0C0", tier: "enterprise", ecoRating: 5, source: "Rawlinsons 2025" },
  brick_veneer: { name: "Brick Veneer", cost: 180, unit: "m²", color: "#8B4513", tier: "pro", ecoRating: 6, source: "ABS Q1 2025" },
  render_acrylic: { name: "Acrylic Render", cost: 85, unit: "m²", color: "#FFDEAD", tier: "pro", ecoRating: 5, source: "RSMeans 2025" },
  cladding_metal: { name: "Metal Cladding", cost: 120, unit: "m²", color: "#778899", tier: "pro", ecoRating: 6, source: "Altus 2025" },
  cladding_timber: { name: "Timber Cladding", cost: 165, unit: "m²", color: "#8B4513", tier: "enterprise", ecoRating: 8, source: "ABS PPI 2025" },
  cladding_composite: { name: "Composite Cladding", cost: 145, unit: "m²", color: "#696969", tier: "enterprise", ecoRating: 7, source: "Global benchmarks" },
  
  // Roofing Materials
  colorbond_steel: { name: "Colorbond Steel", cost: 80, unit: "m²", color: "#4682B4", tier: "free", ecoRating: 7, source: "BlueScope 2025" },
  concrete_tiles: { name: "Concrete Tiles", cost: 75, unit: "m²", color: "#808080", tier: "free", ecoRating: 6, source: "Boral 2025" },
  terracotta_tiles: { name: "Terracotta Tiles", cost: 95, unit: "m²", color: "#CD5C5C", tier: "pro", ecoRating: 7, source: "Monier 2025" },
  slate_roofing: { name: "Slate Roofing", cost: 185, unit: "m²", color: "#2F4F4F", tier: "enterprise", ecoRating: 8, source: "Rawlinsons 2025" },
  metal_standing_seam: { name: "Standing Seam Metal", cost: 125, unit: "m²", color: "#708090", tier: "pro", ecoRating: 7, source: "Altus 2025" },
  green_roof_extensive: { name: "Extensive Green Roof", cost: 165, unit: "m²", color: "#228B22", tier: "enterprise", ecoRating: 10, source: "Green Roofs Aus 2025" },
  green_roof_intensive: { name: "Intensive Green Roof", cost: 285, unit: "m²", color: "#006400", tier: "enterprise", ecoRating: 10, source: "Green Roofs Aus 2025" },
  membrane_tpo: { name: "TPO Membrane", cost: 95, unit: "m²", color: "#F5F5F5", tier: "pro", ecoRating: 6, source: "RSMeans 2025" },
  membrane_pvc: { name: "PVC Membrane", cost: 105, unit: "m²", color: "#DCDCDC", tier: "pro", ecoRating: 5, source: "RSMeans 2025" },
  membrane_epdm: { name: "EPDM Membrane", cost: 85, unit: "m²", color: "#2F2F2F", tier: "pro", ecoRating: 6, source: "Global benchmarks" },
  
  // Insulation Materials
  insulation_polyiso: { name: "Polyiso Insulation", cost: 15, unit: "m²", color: "#FFE4B5", tier: "pro", ecoRating: 7, source: "RSMeans 2025" },
  insulation_xps: { name: "XPS Insulation", cost: 12, unit: "m²", color: "#87CEEB", tier: "pro", ecoRating: 6, source: "Altus 2025" },
  insulation_eps: { name: "EPS Insulation", cost: 10, unit: "m²", color: "#F0F8FF", tier: "free", ecoRating: 6, source: "ABS Q1 2025" },
  insulation_mineral_wool: { name: "Mineral Wool", cost: 14, unit: "m²", color: "#D3D3D3", tier: "pro", ecoRating: 8, source: "Rockwool 2025" },
  insulation_spray_foam: { name: "Spray Foam", cost: 25, unit: "m²", color: "#FFFACD", tier: "enterprise", ecoRating: 5, source: "RSMeans 2025" },
  insulation_cellulose: { name: "Cellulose Insulation", cost: 9, unit: "m²", color: "#F5DEB3", tier: "pro", ecoRating: 9, source: "Green Building 2025" },
  
  // Windows and Doors
  window_aluminium_single: { name: "Aluminium Window (Single)", cost: 320, unit: "m²", color: "#C0C0C0", tier: "free", ecoRating: 4, source: "AWS 2025" },
  window_aluminium_double: { name: "Aluminium Window (Double)", cost: 480, unit: "m²", color: "#A9A9A9", tier: "pro", ecoRating: 6, source: "AWS 2025" },
  window_timber_single: { name: "Timber Window (Single)", cost: 450, unit: "m²", color: "#8B4513", tier: "pro", ecoRating: 7, source: "Stegbar 2025" },
  window_timber_double: { name: "Timber Window (Double)", cost: 650, unit: "m²", color: "#654321", tier: "enterprise", ecoRating: 8, source: "Stegbar 2025" },
  window_upvc: { name: "uPVC Window", cost: 380, unit: "m²", color: "#F5F5F5", tier: "pro", ecoRating: 6, source: "Altus 2025" },
  door_solid_timber: { name: "Solid Timber Door", cost: 850, unit: "each", color: "#8B4513", tier: "pro", ecoRating: 8, source: "Corinthian 2025" },
  door_hollow_core: { name: "Hollow Core Door", cost: 180, unit: "each", color: "#D2B48C", tier: "free", ecoRating: 5, source: "Bunnings 2025" },
  door_glass_sliding: { name: "Glass Sliding Door", cost: 1200, unit: "each", color: "#87CEEB", tier: "pro", ecoRating: 5, source: "Stegbar 2025" },
  door_automatic: { name: "Automatic Door", cost: 4500, unit: "each", color: "#4682B4", tier: "enterprise", ecoRating: 4, source: "ASSA ABLOY 2025" },
  door_fire_rated: { name: "Fire Rated Door", cost: 650, unit: "each", color: "#DC143C", tier: "pro", ecoRating: 5, source: "Pyropanel 2025" },
  
  // Interior Finishes
  plasterboard_standard: { name: "Standard Plasterboard", cost: 12, unit: "m²", color: "#F5F5F5", tier: "free", ecoRating: 6, source: "USG Boral 2025" },
  plasterboard_moisture: { name: "Moisture Resistant Plasterboard", cost: 18, unit: "m²", color: "#B0E0E6", tier: "pro", ecoRating: 6, source: "USG Boral 2025" },
  plasterboard_fire: { name: "Fire Rated Plasterboard", cost: 22, unit: "m²", color: "#FFB6C1", tier: "pro", ecoRating: 6, source: "USG Boral 2025" },
  plasterboard_acoustic: { name: "Acoustic Plasterboard", cost: 28, unit: "m²", color: "#DDA0DD", tier: "enterprise", ecoRating: 6, source: "USG Boral 2025" },
  ceiling_suspended: { name: "Suspended Ceiling", cost: 45, unit: "m²", color: "#F0F8FF", tier: "pro", ecoRating: 5, source: "Armstrong 2025" },
  ceiling_exposed_grid: { name: "Exposed Grid Ceiling", cost: 38, unit: "m²", color: "#696969", tier: "pro", ecoRating: 5, source: "Armstrong 2025" },
  
  // Paints and Coatings
  paint_interior_low_voc: { name: "Interior Paint (Low VOC)", cost: 8, unit: "m²", color: "#FFFAF0", tier: "free", ecoRating: 8, source: "Dulux 2025" },
  paint_exterior_weather: { name: "Exterior Weathershield", cost: 12, unit: "m²", color: "#F5FFFA", tier: "free", ecoRating: 7, source: "Dulux 2025" },
  paint_epoxy_floor: { name: "Epoxy Floor Paint", cost: 35, unit: "m²", color: "#4682B4", tier: "pro", ecoRating: 5, source: "Wattyl 2025" },
  paint_intumescent: { name: "Intumescent Paint", cost: 45, unit: "m²", color: "#FF6347", tier: "enterprise", ecoRating: 5, source: "International 2025" },
  coating_anti_graffiti: { name: "Anti-Graffiti Coating", cost: 25, unit: "m²", color: "#F0E68C", tier: "pro", ecoRating: 6, source: "Graffiti Shield 2025" },
  
  // Mechanical Services
  hvac_ducted_residential: { name: "Ducted AC (Residential)", cost: 120, unit: "m²", color: "#87CEEB", tier: "pro", ecoRating: 6, source: "Daikin 2025" },
  hvac_ducted_commercial: { name: "Ducted AC (Commercial)", cost: 180, unit: "m²", color: "#4682B4", tier: "enterprise", ecoRating: 6, source: "Daikin 2025" },
  hvac_vrf_system: { name: "VRF System", cost: 220, unit: "m²", color: "#1E90FF", tier: "enterprise", ecoRating: 7, source: "Mitsubishi 2025" },
  hvac_chilled_beams: { name: "Chilled Beams", cost: 165, unit: "m²", color: "#00BFFF", tier: "enterprise", ecoRating: 8, source: "Trox 2025" },
  ventilation_natural: { name: "Natural Ventilation", cost: 35, unit: "m²", color: "#98FB98", tier: "pro", ecoRating: 10, source: "Green Building 2025" },
  ventilation_mechanical: { name: "Mechanical Ventilation", cost: 65, unit: "m²", color: "#3CB371", tier: "pro", ecoRating: 6, source: "Fantech 2025" },
  heating_hydronic: { name: "Hydronic Heating", cost: 125, unit: "m²", color: "#FF6347", tier: "enterprise", ecoRating: 8, source: "Rehau 2025" },
  heating_underfloor_electric: { name: "Electric Underfloor Heating", cost: 85, unit: "m²", color: "#FFA500", tier: "pro", ecoRating: 5, source: "Speedheat 2025" },
  
  // Plumbing Fixtures
  toilet_standard: { name: "Standard Toilet", cost: 350, unit: "each", color: "#F0F8FF", tier: "free", ecoRating: 6, source: "Caroma 2025" },
  toilet_wall_hung: { name: "Wall Hung Toilet", cost: 650, unit: "each", color: "#E0FFFF", tier: "pro", ecoRating: 7, source: "Caroma 2025" },
  toilet_smart: { name: "Smart Toilet", cost: 2500, unit: "each", color: "#ADD8E6", tier: "enterprise", ecoRating: 6, source: "Kohler 2025" },
  basin_pedestal: { name: "Pedestal Basin", cost: 250, unit: "each", color: "#F0FFFF", tier: "free", ecoRating: 6, source: "Caroma 2025" },
  basin_wall_mounted: { name: "Wall Mounted Basin", cost: 450, unit: "each", color: "#E6E6FA", tier: "pro", ecoRating: 6, source: "Caroma 2025" },
  basin_vessel: { name: "Vessel Basin", cost: 550, unit: "each", color: "#D8BFD8", tier: "pro", ecoRating: 6, source: "Kohler 2025" },
  shower_standard: { name: "Standard Shower", cost: 450, unit: "each", color: "#B0C4DE", tier: "free", ecoRating: 5, source: "Methven 2025" },
  shower_rainfall: { name: "Rainfall Shower", cost: 850, unit: "each", color: "#87CEEB", tier: "pro", ecoRating: 6, source: "Hansgrohe 2025" },
  shower_digital: { name: "Digital Shower System", cost: 2200, unit: "each", color: "#4682B4", tier: "enterprise", ecoRating: 6, source: "Moen 2025" },
  
  // Electrical Components
  switchboard_residential: { name: "Residential Switchboard", cost: 850, unit: "each", color: "#696969", tier: "free", ecoRating: 5, source: "Clipsal 2025" },
  switchboard_commercial: { name: "Commercial Switchboard", cost: 3500, unit: "each", color: "#2F4F4F", tier: "enterprise", ecoRating: 5, source: "Schneider 2025" },
  power_outlet_standard: { name: "Standard Power Outlet", cost: 25, unit: "each", color: "#F5F5F5", tier: "free", ecoRating: 5, source: "Clipsal 2025" },
  power_outlet_usb: { name: "USB Power Outlet", cost: 45, unit: "each", color: "#DCDCDC", tier: "pro", ecoRating: 6, source: "Clipsal 2025" },
  lighting_led_downlight: { name: "LED Downlight", cost: 35, unit: "each", color: "#FFFACD", tier: "free", ecoRating: 8, source: "Philips 2025" },
  lighting_pendant: { name: "Pendant Light", cost: 185, unit: "each", color: "#FFD700", tier: "pro", ecoRating: 6, source: "Beacon 2025" },
  lighting_chandelier: { name: "Chandelier", cost: 1850, unit: "each", color: "#FFD700", tier: "enterprise", ecoRating: 5, source: "Custom Lighting 2025" },
  lighting_track: { name: "Track Lighting", cost: 95, unit: "metre", color: "#F0E68C", tier: "pro", ecoRating: 7, source: "Erco 2025" },
  lighting_emergency: { name: "Emergency Lighting", cost: 125, unit: "each", color: "#FF0000", tier: "pro", ecoRating: 5, source: "Clevertronics 2025" },
  
  // Fire Services
  sprinkler_concealed: { name: "Concealed Sprinkler", cost: 85, unit: "each", color: "#DC143C", tier: "pro", ecoRating: 5, source: "Tyco 2025" },
  sprinkler_exposed: { name: "Exposed Sprinkler", cost: 65, unit: "each", color: "#B22222", tier: "pro", ecoRating: 5, source: "Tyco 2025" },
  fire_extinguisher_powder: { name: "Powder Extinguisher", cost: 125, unit: "each", color: "#FF0000", tier: "free", ecoRating: 5, source: "Chubb 2025" },
  fire_extinguisher_co2: { name: "CO2 Extinguisher", cost: 185, unit: "each", color: "#8B0000", tier: "pro", ecoRating: 5, source: "Chubb 2025" },
  fire_hose_reel: { name: "Fire Hose Reel", cost: 450, unit: "each", color: "#DC143C", tier: "pro", ecoRating: 5, source: "FireMate 2025" },
  smoke_detector_photoelectric: { name: "Photoelectric Smoke Detector", cost: 45, unit: "each", color: "#F5F5F5", tier: "free", ecoRating: 5, source: "Brooks 2025" },
  smoke_detector_ionisation: { name: "Ionisation Smoke Detector", cost: 35, unit: "each", color: "#DCDCDC", tier: "free", ecoRating: 5, source: "Brooks 2025" },
  
  // Security Systems
  cctv_dome: { name: "Dome CCTV Camera", cost: 285, unit: "each", color: "#2F2F2F", tier: "pro", ecoRating: 5, source: "Hikvision 2025" },
  cctv_bullet: { name: "Bullet CCTV Camera", cost: 225, unit: "each", color: "#696969", tier: "pro", ecoRating: 5, source: "Hikvision 2025" },
  cctv_ptz: { name: "PTZ Camera", cost: 1850, unit: "each", color: "#4F4F4F", tier: "enterprise", ecoRating: 5, source: "Axis 2025" },
  access_control_card: { name: "Card Access System", cost: 850, unit: "door", color: "#4169E1", tier: "pro", ecoRating: 5, source: "HID 2025" },
  access_control_biometric: { name: "Biometric Access", cost: 1650, unit: "door", color: "#0000FF", tier: "enterprise", ecoRating: 6, source: "Suprema 2025" },
  alarm_system_basic: { name: "Basic Alarm System", cost: 650, unit: "system", color: "#FF4500", tier: "free", ecoRating: 5, source: "Bosch 2025" },
  alarm_system_smart: { name: "Smart Alarm System", cost: 1850, unit: "system", color: "#FF6347", tier: "enterprise", ecoRating: 6, source: "Honeywell 2025" },
  
  // Landscaping Materials
  turf_buffalo: { name: "Buffalo Turf", cost: 12, unit: "m²", color: "#228B22", tier: "free", ecoRating: 8, source: "AusGAP 2025" },
  turf_couch: { name: "Couch Turf", cost: 10, unit: "m²", color: "#32CD32", tier: "free", ecoRating: 8, source: "AusGAP 2025" },
  turf_synthetic: { name: "Synthetic Turf", cost: 65, unit: "m²", color: "#00FF00", tier: "pro", ecoRating: 3, source: "SynLawn 2025" },
  mulch_hardwood: { name: "Hardwood Mulch", cost: 45, unit: "m³", color: "#8B4513", tier: "free", ecoRating: 8, source: "ANL 2025" },
  mulch_pine_bark: { name: "Pine Bark Mulch", cost: 55, unit: "m³", color: "#A0522D", tier: "free", ecoRating: 8, source: "ANL 2025" },
  gravel_river: { name: "River Gravel", cost: 85, unit: "m³", color: "#708090", tier: "free", ecoRating: 7, source: "Boral 2025" },
  gravel_crushed: { name: "Crushed Gravel", cost: 65, unit: "m³", color: "#696969", tier: "free", ecoRating: 7, source: "Boral 2025" },
  pavers_concrete: { name: "Concrete Pavers", cost: 45, unit: "m²", color: "#A9A9A9", tier: "free", ecoRating: 6, source: "Adbri 2025" },
  pavers_clay: { name: "Clay Pavers", cost: 65, unit: "m²", color: "#CD5C5C", tier: "pro", ecoRating: 7, source: "Austral 2025" },
  pavers_natural_stone: { name: "Natural Stone Pavers", cost: 125, unit: "m²", color: "#8B7355", tier: "enterprise", ecoRating: 8, source: "Eco Outdoor 2025" },
  
  // Specialty Materials
  acoustic_panels_fabric: { name: "Fabric Acoustic Panels", cost: 185, unit: "m²", color: "#4B0082", tier: "pro", ecoRating: 7, source: "Autex 2025" },
  acoustic_panels_perforated: { name: "Perforated Acoustic Panels", cost: 225, unit: "m²", color: "#483D8B", tier: "enterprise", ecoRating: 6, source: "Supawood 2025" },
  solar_panels_standard: { name: "Standard Solar Panel", cost: 285, unit: "each", color: "#00008B", tier: "pro", ecoRating: 10, source: "Jinko 2025" },
  solar_panels_premium: { name: "Premium Solar Panel", cost: 485, unit: "each", color: "#000080", tier: "enterprise", ecoRating: 10, source: "SunPower 2025" },
  waterproofing_membrane: { name: "Waterproofing Membrane", cost: 45, unit: "m²", color: "#4682B4", tier: "pro", ecoRating: 6, source: "Ardex 2025" },
  waterproofing_liquid: { name: "Liquid Waterproofing", cost: 35, unit: "m²", color: "#1E90FF", tier: "pro", ecoRating: 6, source: "Sika 2025" },
  
  // Commercial Kitchen Equipment
  kitchen_commercial_range: { name: "Commercial Range", cost: 8500, unit: "each", color: "#C0C0C0", tier: "enterprise", ecoRating: 5, source: "Goldstein 2025" },
  kitchen_commercial_oven: { name: "Commercial Oven", cost: 12500, unit: "each", color: "#A9A9A9", tier: "enterprise", ecoRating: 5, source: "Rational 2025" },
  kitchen_exhaust_hood: { name: "Exhaust Hood", cost: 3500, unit: "metre", color: "#708090", tier: "enterprise", ecoRating: 5, source: "Halton 2025" },
  kitchen_coolroom: { name: "Coolroom Panel", cost: 185, unit: "m²", color: "#F0F8FF", tier: "enterprise", ecoRating: 6, source: "Bondor 2025" },
  kitchen_stainless_bench: { name: "Stainless Steel Bench", cost: 850, unit: "metre", color: "#C0C0C0", tier: "pro", ecoRating: 6, source: "Simply Stainless 2025" },
  
  // Joinery and Fixtures
  joinery_laminate: { name: "Laminate Joinery", cost: 450, unit: "m²", color: "#DEB887", tier: "free", ecoRating: 5, source: "Laminex 2025" },
  joinery_melamine: { name: "Melamine Joinery", cost: 350, unit: "m²", color: "#F5DEB3", tier: "free", ecoRating: 5, source: "Polytec 2025" },
  joinery_veneer: { name: "Veneer Joinery", cost: 850, unit: "m²", color: "#8B4513", tier: "pro", ecoRating: 7, source: "Briggs 2025" },
  joinery_solid_timber: { name: "Solid Timber Joinery", cost: 1250, unit: "m²", color: "#654321", tier: "enterprise", ecoRating: 8, source: "Custom Made 2025" },
  benchtop_laminate: { name: "Laminate Benchtop", cost: 185, unit: "m²", color: "#D2B48C", tier: "free", ecoRating: 5, source: "Laminex 2025" },
  benchtop_stone: { name: "Stone Benchtop", cost: 650, unit: "m²", color: "#696969", tier: "pro", ecoRating: 7, source: "Caesarstone 2025" },
  benchtop_timber: { name: "Timber Benchtop", cost: 450, unit: "m²", color: "#8B4513", tier: "pro", ecoRating: 8, source: "Timber Revival 2025" },
  benchtop_concrete: { name: "Concrete Benchtop", cost: 550, unit: "m²", color: "#808080", tier: "enterprise", ecoRating: 6, source: "Concrete Studio 2025" },
  
  // Lift and Escalators
  lift_passenger_8: { name: "Passenger Lift (8 person)", cost: 85000, unit: "each", color: "#4682B4", tier: "enterprise", ecoRating: 6, source: "Otis 2025" },
  lift_passenger_13: { name: "Passenger Lift (13 person)", cost: 125000, unit: "each", color: "#5F9EA0", tier: "enterprise", ecoRating: 6, source: "Otis 2025" },
  lift_goods: { name: "Goods Lift", cost: 95000, unit: "each", color: "#708090", tier: "enterprise", ecoRating: 5, source: "Kone 2025" },
  escalator_standard: { name: "Standard Escalator", cost: 285000, unit: "each", color: "#696969", tier: "enterprise", ecoRating: 5, source: "Schindler 2025" },
  travelator: { name: "Travelator", cost: 185000, unit: "each", color: "#778899", tier: "enterprise", ecoRating: 5, source: "ThyssenKrupp 2025" }
} as const;

export type MaterialType = keyof typeof MATERIALS;

// Australian Rates 2025
export const AUSTRALIAN_RATES = {
  // Existing rates...
  
  // Expanded 2025 escalations/multipliers (from ABS 3.7% annual, Altus 4.8-5.7% forecast)
  escalation_factors: {
    q1_2025: 0.9, // ABS March 2025 quarterly rise
    annual_2025: 3.7, // ABS to March 2025
    forecast_2027: 5.2, // Altus avg. to 2027
  },
  materials_adjustments: {
    timber: -0.4, // ABS Q1 2025
    softwood_structural: -2.9, // ABS
    steel: 2.5, // Altus sample rise
    concrete: 1.8, // Estimated from trends
  },
  labour_rates: {
    carpenter: 65,
    electrician: 85,
    plumber: 82,
    painter: 55,
    tiler: 70,
    plasterer: 65,
    bricklayer: 75,
    concrete_worker: 60,
    steel_fixer: 70,
    roofer: 65,
    glazier: 70,
    hvac_technician: 85,
    quantity_surveyor: 95, // Updated 2025 rate (Rawlinsons sample)
    site_manager: 110, // Adjusted for escalation
    project_manager: 125,
    architect: 145,
    engineer: 135,
  },
  // Install rates for parametric (e.g., wall install $50/m²)
  install_rates: {
    wall_install: 50,
    floor_install: 45,
    roof_install: 65,
    window_install: 85,
    door_install: 120,
    mep_install: 95,
  },
  preliminaries: {
    site_facilities: 2500, // per month
    site_management: 8500, // per month
    security: 1500, // per month
    insurances: 2.5, // percentage
    temporary_works: 3500, // per month
  },
  overheads_profit: {
    overheads: 15, // percentage
    profit: 12, // percentage
    contingency: 8, // percentage
    gst: 10, // percentage
  }
} as const;

// New: Parametric Assemblies Schema
export interface ParametricAssembly {
  id: string;
  name: string;
  components: { material: string; quantity: number; unit: string }[];
  supply_cost: number;
  install_cost: number;
  total_cost: number;
  eco_rating: number;
}

export const PARAMETRIC_ASSEMBLIES: ParametricAssembly[] = [
  {
    id: "finished_wall",
    name: "Finished Wall (Concrete + Plaster)",
    components: [
      { material: "concrete_ready_mix", quantity: 0.15, unit: "m³/m²" },
      { material: "gypsum_board", quantity: 1, unit: "m²" },
      { material: "insulation_fiberglass", quantity: 1, unit: "m²" },
    ],
    supply_cost: 50, // Per m² (RSMeans sample adapted)
    install_cost: 30, // Labor (Rawlinsons/Altus adjusted)
    total_cost: 80,
    eco_rating: 6,
  },
  {
    id: "timber_floor",
    name: "Timber Floor Assembly",
    components: [
      { material: "softwood_timber", quantity: 0.2, unit: "m³/m²" },
      { material: "hardwood_oak", quantity: 0.02, unit: "m³/m²" },
    ],
    supply_cost: 100,
    install_cost: 45,
    total_cost: 145,
    eco_rating: 7,
  },
  {
    id: "curtain_wall_system",
    name: "Curtain Wall System",
    components: [
      { material: "curtain_wall_glass", quantity: 0.8, unit: "m²" },
      { material: "curtain_wall_aluminium", quantity: 0.2, unit: "m²" },
    ],
    supply_cost: 480,
    install_cost: 120,
    total_cost: 600,
    eco_rating: 5,
  },
  {
    id: "commercial_kitchen",
    name: "Commercial Kitchen Setup",
    components: [
      { material: "kitchen_commercial_range", quantity: 0.1, unit: "units/m²" },
      { material: "kitchen_exhaust_hood", quantity: 0.5, unit: "m" },
      { material: "kitchen_stainless_bench", quantity: 0.8, unit: "m" },
    ],
    supply_cost: 850,
    install_cost: 250,
    total_cost: 1100,
    eco_rating: 5,
  },
  {
    id: "green_roof_system",
    name: "Extensive Green Roof System",
    components: [
      { material: "green_roof_extensive", quantity: 1, unit: "m²" },
      { material: "waterproofing_membrane", quantity: 1, unit: "m²" },
      { material: "insulation_xps", quantity: 1, unit: "m²" },
    ],
    supply_cost: 180,
    install_cost: 45,
    total_cost: 225,
    eco_rating: 10,
  },
  {
    id: "acoustic_wall_system",
    name: "Acoustic Wall System",
    components: [
      { material: "acoustic_panels_fabric", quantity: 0.8, unit: "m²" },
      { material: "plasterboard_acoustic", quantity: 1, unit: "m²" },
      { material: "insulation_mineral_wool", quantity: 2, unit: "m²" },
    ],
    supply_cost: 165,
    install_cost: 55,
    total_cost: 220,
    eco_rating: 7,
  },
  {
    id: "bathroom_fitout",
    name: "Complete Bathroom Fitout",
    components: [
      { material: "toilet_wall_hung", quantity: 1, unit: "each" },
      { material: "basin_vessel", quantity: 1, unit: "each" },
      { material: "shower_rainfall", quantity: 1, unit: "each" },
      { material: "tiles", quantity: 25, unit: "m²" },
    ],
    supply_cost: 2800,
    install_cost: 1200,
    total_cost: 4000,
    eco_rating: 6,
  },
  {
    id: "solar_power_system",
    name: "Solar Power System (10kW)",
    components: [
      { material: "solar_panels_premium", quantity: 25, unit: "each" },
      { material: "electrical_inverter", quantity: 1, unit: "each" },
      { material: "electrical_mounting", quantity: 25, unit: "each" },
    ],
    supply_cost: 8500,
    install_cost: 1500,
    total_cost: 10000,
    eco_rating: 10,
  },
  {
    id: "fire_services_basic",
    name: "Basic Fire Services Package",
    components: [
      { material: "sprinkler_concealed", quantity: 0.5, unit: "each/m²" },
      { material: "smoke_detector_photoelectric", quantity: 0.1, unit: "each/m²" },
      { material: "fire_extinguisher_powder", quantity: 0.02, unit: "each/m²" },
    ],
    supply_cost: 45,
    install_cost: 20,
    total_cost: 65,
    eco_rating: 5,
  },
  {
    id: "security_system_advanced",
    name: "Advanced Security System",
    components: [
      { material: "cctv_ptz", quantity: 0.05, unit: "each/m²" },
      { material: "access_control_biometric", quantity: 0.1, unit: "doors/m²" },
      { material: "alarm_system_smart", quantity: 0.01, unit: "system/m²" },
    ],
    supply_cost: 185,
    install_cost: 65,
    total_cost: 250,
    eco_rating: 5,
  }
];

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
