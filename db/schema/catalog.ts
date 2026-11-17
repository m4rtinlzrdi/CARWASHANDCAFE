import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, emptyTextArray, id, updatedAt } from "./common";
import { catalogGroupEnum, discountTypeEnum, priceStatusEnum, promotionKindEnum, promotionTargetTypeEnum } from "./enums";

export const categories = pgTable(
  "categories",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    group: catalogGroupEnum("group").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("categories_slug_unique").on(table.slug),
    index("categories_group_sort_active_idx").on(table.group, table.sortOrder, table.isActive),
    check("categories_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: id(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    priceStatus: priceStatusEnum("price_status").notNull().default("confirmed"),
    imageUrl: text("image_url"),
    labels: text("labels").array().$type<string[]>().notNull().default(emptyTextArray()),
    isFeatured: boolean("is_featured").notNull().default(false),
    isAvailable: boolean("is_available").notNull().default(true),
    discountType: discountTypeEnum("discount_type"),
    discountValue: integer("discount_value"),
    discountStartAt: timestamp("start_at", { withTimezone: true }),
    discountEndAt: timestamp("end_at", { withTimezone: true }),
    kasirProductId: text("kasir_product_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("menu_items_category_sort_active_idx")
      .on(table.categoryId, table.sortOrder)
      .where(sql`${table.deletedAt} IS NULL`),
    index("menu_items_available_status_idx").on(table.isAvailable, table.priceStatus),
    check("menu_items_price_nonnegative", sql`${table.price} >= 0`),
    check("menu_items_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    check(
      "menu_items_discount_valid",
      sql`(
        ${table.discountType} IS NULL AND ${table.discountValue} IS NULL AND ${table.discountStartAt} IS NULL AND ${table.discountEndAt} IS NULL
      ) OR (
        ${table.discountType} = 'percentage' AND ${table.discountValue} BETWEEN 1 AND 100 AND ${table.discountStartAt} IS NOT NULL AND ${table.discountEndAt} IS NOT NULL AND ${table.discountEndAt} > ${table.discountStartAt}
      ) OR (
        ${table.discountType} = 'fixed' AND ${table.discountValue} > 0 AND ${table.discountStartAt} IS NOT NULL AND ${table.discountEndAt} IS NOT NULL AND ${table.discountEndAt} > ${table.discountStartAt}
      )`,
    ),
  ],
);

export const menuVariants = pgTable(
  "menu_variants",
  {
    id: id(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    priceDifference: integer("price_difference").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("menu_variants_item_name_unique").on(table.menuItemId, table.name),
    index("menu_variants_item_sort_idx").on(table.menuItemId, table.sortOrder),
    check("menu_variants_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const addons = pgTable(
  "addons",
  {
    id: id(),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    group: catalogGroupEnum("group").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    kasirProductId: text("kasir_product_id"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("addons_group_active_sort_idx").on(table.group, table.isActive, table.sortOrder),
    check("addons_price_nonnegative", sql`${table.price} >= 0`),
    check("addons_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const addonCategories = pgTable(
  "addon_categories",
  {
    id: id(),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => addons.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("addon_categories_addon_category_unique").on(table.addonId, table.categoryId),
    index("addon_categories_category_idx").on(table.categoryId),
  ],
);

export const menuItemAddons = pgTable(
  "menu_item_addons",
  {
    id: id(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "restrict" }),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => addons.id, { onDelete: "restrict" }),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("menu_item_addons_item_addon_unique").on(table.menuItemId, table.addonId),
    index("menu_item_addons_addon_idx").on(table.addonId),
  ],
);

export const promotions = pgTable(
  "promotions",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    kind: promotionKindEnum("kind").notNull(),
    discountType: discountTypeEnum("discount_type"),
    discountValue: integer("discount_value"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("promotions_active_window_idx").on(table.isActive, table.startAt, table.endAt),
    check("promotions_end_after_start", sql`${table.endAt} > ${table.startAt}`),
    check("promotions_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    check(
      "promotions_discount_valid",
      sql`(
        ${table.kind} = 'info' AND ${table.discountType} IS NULL AND ${table.discountValue} IS NULL
      ) OR (
        ${table.kind} = 'discount' AND ${table.discountType} = 'percentage' AND ${table.discountValue} BETWEEN 1 AND 100
      ) OR (
        ${table.kind} = 'discount' AND ${table.discountType} = 'fixed' AND ${table.discountValue} > 0
      )`,
    ),
  ],
);

export const promotionTargets = pgTable(
  "promotion_targets",
  {
    id: id(),
    promotionId: uuid("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "restrict" }),
    targetType: promotionTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("promotion_targets_promotion_target_unique").on(table.promotionId, table.targetType, table.targetId),
    index("promotion_targets_target_idx").on(table.targetType, table.targetId),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
  addonCategories: many(addonCategories),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
  variants: many(menuVariants),
  addons: many(menuItemAddons),
}));

export const menuVariantsRelations = relations(menuVariants, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuVariants.menuItemId], references: [menuItems.id] }),
}));

export const addonsRelations = relations(addons, ({ many }) => ({
  categories: many(addonCategories),
  menuItems: many(menuItemAddons),
}));

export const addonCategoriesRelations = relations(addonCategories, ({ one }) => ({
  addon: one(addons, { fields: [addonCategories.addonId], references: [addons.id] }),
  category: one(categories, { fields: [addonCategories.categoryId], references: [categories.id] }),
}));

export const menuItemAddonsRelations = relations(menuItemAddons, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemAddons.menuItemId], references: [menuItems.id] }),
  addon: one(addons, { fields: [menuItemAddons.addonId], references: [addons.id] }),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({ targets: many(promotionTargets) }));

export const promotionTargetsRelations = relations(promotionTargets, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionTargets.promotionId], references: [promotions.id] }),
}));
