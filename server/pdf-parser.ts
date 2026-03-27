import { fromPath } from "pdf2pic";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "./db";
import { pdfTakeoffs } from "@shared/schema";
import { eq } from "drizzle-orm";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";
const PDF_IMAGES_DIR = path.join(UPLOADS_DIR, "pdf-images");

// Ensure directories exist
async function ensureDirectories() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
  if (!existsSync(PDF_IMAGES_DIR)) {
    await mkdir(PDF_IMAGES_DIR, { recursive: true });
  }
}

export interface PDFPageInfo {
  pageNumber: number;
  imagePath: string;
  imageUrl: string;
  width: number;
  height: number;
}

export interface PDFParseResult {
  id: string;
  fileName: string;
  fileKey: string;
  pageCount: number;
  pages: PDFPageInfo[];
}

/**
 * Generate a unique file key for storage
 */
export function generateFileKey(originalName: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${timestamp}-${random}-${sanitized}`;
}

/**
 * Save uploaded PDF file to disk
 */
export async function savePDFFile(
  buffer: Buffer,
  originalName: string
): Promise<{ fileKey: string; filePath: string }> {
  await ensureDirectories();
  
  const fileKey = generateFileKey(originalName);
  const filePath = path.join(UPLOADS_DIR, fileKey);
  
  await writeFile(filePath, buffer);
  
  return { fileKey, filePath };
}

/**
 * Convert PDF pages to images using pdf2pic
 */
export async function convertPDFToImages(
  pdfPath: string,
  takeoffId: number
): Promise<PDFPageInfo[]> {
  await ensureDirectories();
  
  const outputDir = path.join(PDF_IMAGES_DIR, takeoffId.toString());
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const convert = fromPath(pdfPath, {
    density: 150,
    format: "png",
    width: 1920,
    height: 1080,
    preserveAspectRatio: true,
    savePath: outputDir,
  });

  const results = await convert.bulk(-1); // Convert all pages
  
  return results.map((result, index) => ({
    pageNumber: index + 1,
    imagePath: result.path,
    imageUrl: `/uploads/pdf-images/${takeoffId}/${path.basename(result.path)}`,
    width: 1920,
    height: result.height ? Math.round(1920 * (result.height / (result.width || 1920))) : 1080,
  }));
}

/**
 * Parse PDF and create a takeoff record
 */
export async function parsePDF(
  buffer: Buffer,
  fileName: string,
  projectId: number
): Promise<PDFParseResult> {
  // Save the PDF file
  const { fileKey, filePath } = await savePDFFile(buffer, fileName);
  
  // Create database record
  const [takeoff] = await db
    .insert(pdfTakeoffs)
    .values({
      projectId,
      fileName,
      fileUrl: `/uploads/${fileKey}`,
      fileKey,
      pageCount: 1, // Will update after conversion
      measurements: [],
    })
    .returning();

  // Convert PDF to images
  const pages = await convertPDFToImages(filePath, takeoff.id);
  
  // Update page count
  await db
    .update(pdfTakeoffs)
    .set({ pageCount: pages.length })
    .where(eq(pdfTakeoffs.id, takeoff.id));

  return {
    id: takeoff.id.toString(),
    fileName: takeoff.fileName,
    fileKey: takeoff.fileKey,
    pageCount: pages.length,
    pages,
  };
}

/**
 * Get PDF takeoff by ID
 */
export async function getPDFTakeoff(takeoffId: number) {
  const [takeoff] = await db
    .select()
    .from(pdfTakeoffs)
    .where(eq(pdfTakeoffs.id, takeoffId));
  
  if (!takeoff) return null;

  // Get page images
  const outputDir = path.join(PDF_IMAGES_DIR, takeoffId.toString());
  const pages: PDFPageInfo[] = [];
  
  for (let i = 1; i <= takeoff.pageCount; i++) {
    const imageName = `${i}.png`;
    const imagePath = path.join(outputDir, imageName);
    
    if (existsSync(imagePath)) {
      pages.push({
        pageNumber: i,
        imagePath,
        imageUrl: `/uploads/pdf-images/${takeoffId}/${imageName}`,
        width: 1920,
        height: 1080,
      });
    }
  }

  return {
    ...takeoff,
    pages,
  };
}

/**
 * Get all PDF takeoffs for a project
 */
export async function getProjectPDFTakeoffs(projectId: number) {
  return await db
    .select()
    .from(pdfTakeoffs)
    .where(eq(pdfTakeoffs.projectId, projectId));
}

/**
 * Update measurements for a PDF takeoff
 */
export async function updateMeasurements(
  takeoffId: number,
  measurements: any[],
  scaleCalibration?: {
    pixelDistance: number;
    realDistance: number;
    unit: 'm' | 'mm' | 'ft';
  }
) {
  const updates: any = { measurements };
  
  if (scaleCalibration) {
    updates.scaleCalibration = scaleCalibration;
    // Calculate scale ratio (pixels per unit)
    updates.scaleRatio = scaleCalibration.pixelDistance / scaleCalibration.realDistance;
  }
  
  const [updated] = await db
    .update(pdfTakeoffs)
    .set(updates)
    .where(eq(pdfTakeoffs.id, takeoffId))
    .returning();
  
  return updated;
}

/**
 * Delete a PDF takeoff
 */
export async function deletePDFTakeoff(takeoffId: number) {
  await db
    .delete(pdfTakeoffs)
    .where(eq(pdfTakeoffs.id, takeoffId));
}

/**
 * Calculate area from polygon points (shoelace formula)
 */
export function calculatePolygonArea(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate length of a line
 */
export function calculateLineLength(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  
  return length;
}

/**
 * Convert pixels to real-world units
 */
export function pixelsToRealUnits(
  pixels: number,
  scaleRatio: number,
  targetUnit: 'm' | 'mm' | 'ft' | 'ft2' | 'm2'
): number {
  // scaleRatio is pixels per meter
  const meters = pixels / scaleRatio;
  
  switch (targetUnit) {
    case 'm':
      return meters;
    case 'mm':
      return meters * 1000;
    case 'ft':
      return meters * 3.28084;
    case 'm2':
      return meters;
    case 'ft2':
      return meters * 10.7639;
    default:
      return meters;
  }
}

/**
 * Calculate measurement value based on type and scale
 */
export function calculateMeasurement(
  type: 'area' | 'length',
  points: { x: number; y: number }[],
  scaleRatio: number
): number {
  if (type === 'area') {
    const pixelArea = calculatePolygonArea(points);
    // Area scales with square of the ratio
    const squareMeters = pixelArea / (scaleRatio * scaleRatio);
    return squareMeters;
  } else {
    const pixelLength = calculateLineLength(points);
    const meters = pixelLength / scaleRatio;
    return meters;
  }
}
