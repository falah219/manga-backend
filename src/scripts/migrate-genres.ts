/**
 * Migration Script: JSONB categories → genres + manga_genres tables
 *
 * Jalankan sekali setelah tabel genres & manga_genres sudah dibuat oleh Sequelize sync.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrate-genres.ts
 *
 * Script ini akan:
 * 1. Baca semua manga yang punya categories (JSONB)
 * 2. Collect unique categories
 * 3. Insert ke tabel genres
 * 4. Insert relasi ke tabel manga_genres
 */

import { Sequelize } from 'sequelize-typescript';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function main() {
    const sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        logging: false,
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // 1. Baca semua manga yang punya categories JSONB
        const [mangas] = await sequelize.query(`
            SELECT id, categories FROM mangas
            WHERE categories IS NOT NULL AND categories != '[]'::jsonb
        `);

        console.log(`📚 Found ${mangas.length} manga(s) with categories`);

        if (mangas.length === 0) {
            console.log('🎉 No categories to migrate. Done!');
            return;
        }

        // 2. Collect unique categories
        const uniqueCategories = new Set<string>();
        for (const manga of mangas as any[]) {
            if (Array.isArray(manga.categories)) {
                manga.categories.forEach((cat: string) => uniqueCategories.add(cat.toLowerCase().trim()));
            }
        }

        console.log(`🏷️  Found ${uniqueCategories.size} unique genre(s):`, [...uniqueCategories]);

        // 3. Insert genres (skip if already exists)
        const genreMap = new Map<string, string>(); // name -> id

        for (const name of uniqueCategories) {
            const slug = name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Check if genre already exists
            const [existing] = await sequelize.query(
                `SELECT id FROM genres WHERE LOWER(name) = LOWER($1)`,
                { bind: [name] }
            );

            if ((existing as any[]).length > 0) {
                genreMap.set(name, (existing as any[])[0].id);
                console.log(`  ⏩ Genre "${name}" already exists, skipping`);
            } else {
                const id = uuidv4();
                await sequelize.query(
                    `INSERT INTO genres (id, name, slug, created_at, updated_at)
                     VALUES ($1, $2, $3, NOW(), NOW())`,
                    { bind: [id, name, slug] }
                );
                genreMap.set(name, id);
                console.log(`  ✅ Created genre "${name}" (${id})`);
            }
        }

        // 4. Create manga_genres relations
        let relationsCreated = 0;
        for (const manga of mangas as any[]) {
            if (!Array.isArray(manga.categories)) continue;

            for (const cat of manga.categories) {
                const genreId = genreMap.get(cat.toLowerCase().trim());
                if (!genreId) continue;

                // Check if relation already exists
                const [existingRel] = await sequelize.query(
                    `SELECT id FROM manga_genres WHERE manga_id = $1 AND genre_id = $2`,
                    { bind: [manga.id, genreId] }
                );

                if ((existingRel as any[]).length === 0) {
                    await sequelize.query(
                        `INSERT INTO manga_genres (id, manga_id, genre_id)
                         VALUES ($1, $2, $3)`,
                        { bind: [uuidv4(), manga.id, genreId] }
                    );
                    relationsCreated++;
                }
            }
        }

        console.log(`\n🎉 Migration complete!`);
        console.log(`   - Genres created: ${uniqueCategories.size}`);
        console.log(`   - Relations created: ${relationsCreated}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

main();
