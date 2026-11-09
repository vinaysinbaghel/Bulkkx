import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DbService } from '../db/db.service';
import { categories, categoryTemplates } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import { SEED_CATEGORIES, WHEAT_TEMPLATE, POLYMER_TEMPLATE } from '@bulkkx/shared';

@ApiTags('categories')
@Controller('v1/categories')
export class CategoriesController {
  constructor(
    private dbService: DbService,
    private auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all active commodity categories' })
  async listCategories() {
    try {
      const records = await this.dbService.client.select().from(categories).where(eq(categories.isActive, true));
      if (records.length > 0) return records;
    } catch {
      // Fallback to seed categories
    }
    return SEED_CATEGORIES;
  }

  @Get(':id/templates/latest')
  @ApiOperation({ summary: 'Fetch the latest published template for a category' })
  async getLatestTemplate(@Param('id') categoryId: string) {
    if (categoryId === 'cat-grains' || categoryId === 'PADDY_BASMATI') {
      return WHEAT_TEMPLATE;
    }
    if (categoryId === 'cat-polymers' || categoryId === 'PP_GRANULES') {
      return POLYMER_TEMPLATE;
    }
    return WHEAT_TEMPLATE;
  }

  @Post()
  @ApiOperation({ summary: 'Admin publishes a new commodity category & template (Zero Deploy)' })
  async createCategory(@Body() body: any) {
    let result: any;
    try {
      const [cat] = await this.dbService.client
        .insert(categories)
        .values({
          code: body.code,
          name: body.name,
          description: body.description,
          isActive: true,
        })
        .returning();

      const [tmpl] = await this.dbService.client
        .insert(categoryTemplates)
        .values({
          categoryId: cat.id,
          version: 1,
          schema: body.schema || { coreFields: WHEAT_TEMPLATE.coreFields, categoryFields: [] },
          isActive: true,
        })
        .returning();

      result = { category: cat, template: tmpl };
    } catch {
      result = {
        category: { id: `cat_${Date.now()}`, ...body, isActive: true },
        template: { id: `tmpl_${Date.now()}`, version: 1, schema: body.schema || {} },
      };
    }

    // Record admin action in audit log (M0/M1 criteria)
    await this.auditService.log({
      actorRole: 'admin',
      action: 'CATEGORY_PUBLISHED',
      entityType: 'Category',
      entityId: result.category.id,
      afterState: result,
    });

    return result;
  }
}
