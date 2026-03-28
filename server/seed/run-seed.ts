/**
 * Database Seed Runner
 * Populates the Elemental Cost Database with initial data
 * 
 * Usage: npx tsx server/seed/run-seed.ts
 */

import { db } from "../db";
import {
  elementCategories,
  buildingTypes,
  qualityLevels,
  elements,
  regionalFactors,
  costRates,
} from "@shared/schema";
import {
  seedElementCategories,
  seedBuildingTypes,
  seedQualityLevels,
  seedElements,
  seedRegionalFactors,
  seedCostRates,
} from "./cost-database";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // 1. Seed Element Categories
    console.log("📂 Seeding element categories...");
    for (const category of seedElementCategories) {
      await db
        .insert(elementCategories)
        .values(category)
        .onConflictDoUpdate({
          target: elementCategories.code,
          set: category,
        });
    }
    console.log(`✅ Seeded ${seedElementCategories.length} element categories`);

    // 2. Seed Building Types
    console.log("\n🏢 Seeding building types...");
    for (const type of seedBuildingTypes) {
      await db
        .insert(buildingTypes)
        .values(type)
        .onConflictDoUpdate({
          target: buildingTypes.code,
          set: type,
        });
    }
    console.log(`✅ Seeded ${seedBuildingTypes.length} building types`);

    // 3. Seed Quality Levels
    console.log("\n⭐ Seeding quality levels...");
    for (const quality of seedQualityLevels) {
      await db
        .insert(qualityLevels)
        .values(quality)
        .onConflictDoUpdate({
          target: qualityLevels.code,
          set: quality,
        });
    }
    console.log(`✅ Seeded ${seedQualityLevels.length} quality levels`);

    // 4. Seed Elements
    console.log("\n🔧 Seeding elements...");
    let elementCount = 0;
    for (const element of seedElements) {
      const result = await db
        .insert(elements)
        .values(element)
        .onConflictDoUpdate({
          target: elements.code,
          set: element,
        })
        .returning({ id: elements.id });
      
      if (result.length > 0) {
        elementCount++;
      }
    }
    console.log(`✅ Seeded ${elementCount} construction elements`);

    // 5. Seed Regional Factors
    console.log("\n🗺️  Seeding regional factors...");
    for (const factor of seedRegionalFactors) {
      await db
        .insert(regionalFactors)
        .values(factor)
        .onConflictDoUpdate({
          target: regionalFactors.region,
          set: factor,
        });
    }
    console.log(`✅ Seeded ${seedRegionalFactors.length} regional factors`);

    // 6. Seed Cost Rates
    console.log("\n💰 Seeding cost rates...");
    let rateCount = 0;
    
    // First, get all element IDs mapped by code
    const allElements = await db.select().from(elements);
    const elementIdByCode = new Map(allElements.map(e => [e.code, e.id]));

    for (const rate of seedCostRates) {
      const elementId = elementIdByCode.get(rate.elementCode);
      
      if (!elementId) {
        console.warn(`⚠️  Element not found for code: ${rate.elementCode}`);
        continue;
      }

      await db
        .insert(costRates)
        .values({
          elementId,
          region: rate.region,
          buildingType: rate.buildingType,
          quality: rate.quality,
          lowRate: rate.lowRate,
          medianRate: rate.medianRate,
          highRate: rate.highRate,
          sampleSize: rate.sampleSize,
          source: rate.source,
          dataQuality: rate.dataQuality,
          confidenceScore: rate.confidenceScore,
        })
        .onConflictDoUpdate({
          target: [costRates.elementId, costRates.region, costRates.buildingType, costRates.quality],
          set: {
            lowRate: rate.lowRate,
            medianRate: rate.medianRate,
            highRate: rate.highRate,
            sampleSize: rate.sampleSize,
            source: rate.source,
            dataQuality: rate.dataQuality,
            confidenceScore: rate.confidenceScore,
            updatedAt: new Date(),
          },
        });
      
      rateCount++;
    }
    console.log(`✅ Seeded ${rateCount} cost rates`);

    console.log("\n✨ Database seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${seedElementCategories.length} element categories`);
    console.log(`   - ${seedBuildingTypes.length} building types`);
    console.log(`   - ${seedQualityLevels.length} quality levels`);
    console.log(`   - ${elementCount} construction elements`);
    console.log(`   - ${seedRegionalFactors.length} regional factors`);
    console.log(`   - ${rateCount} cost rates`);

  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

export { seed };
