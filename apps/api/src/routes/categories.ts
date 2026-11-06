import { Router, Request, Response } from 'express';
import { store } from '../store/memory-store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Category, CategoryTemplate, FIXED_CORE_FIELDS } from '@bulkkx/shared';

export const categoriesRouter = Router();

// GET all active categories
categoriesRouter.get('/', (req: Request, res: Response) => {
  const list = Array.from(store.categories.values()).filter((c) => c.active);
  res.json({ categories: list });
});

// GET category by ID with its active template
categoriesRouter.get('/:id', (req: Request, res: Response) => {
  const category = store.categories.get(req.params.id);
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  const template = store.templates.get(category.activeTemplateId);
  res.json({ category, activeTemplate: template });
});

// POST create/publish new category & template (Admin: zero-deploy commodity rollout)
categoriesRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, description, categoryFields = [] } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Name and slug are required' });
    return;
  }

  const categoryId = `cat-${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const templateId = `tmpl-${slug.toLowerCase()}-v1`;

  const newTemplate: CategoryTemplate = {
    id: templateId,
    categoryId,
    version: 1,
    name: `${name} Standard Specification v1`,
    description: `Auto-generated specification for ${name}`,
    published: true,
    publishedAt: new Date().toISOString(),
    createdBy: req.user?.id || 'admin',
    coreFields: FIXED_CORE_FIELDS,
    categoryFields,
  };

  const newCategory: Category = {
    id: categoryId,
    name,
    slug,
    description: description || `Trading market for ${name}`,
    activeTemplateId: templateId,
    active: true,
    createdAt: new Date().toISOString(),
  };

  store.templates.set(newTemplate.id, newTemplate);
  store.categories.set(newCategory.id, newCategory);

  // Audit
  store.auditLogs.push({
    id: `audit-${Date.now()}`,
    actorId: req.user?.id || 'admin',
    actorRole: req.user?.role || 'admin',
    action: 'CREATE_CATEGORY_TEMPLATE',
    entityType: 'category',
    entityId: newCategory.id,
    after: { category: newCategory, template: newTemplate },
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    message: `Category '${name}' created and published with zero deploy!`,
    category: newCategory,
    template: newTemplate,
  });
});
