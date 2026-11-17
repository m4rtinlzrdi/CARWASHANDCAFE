import {
  addons,
  addonCategories,
  addonCategoriesRelations,
  addonsRelations,
  categories,
  categoriesRelations,
  menuItemAddons,
  menuItemAddonsRelations,
  menuItems,
  menuItemsRelations,
  menuVariants,
  menuVariantsRelations,
  promotionTargets,
  promotionTargetsRelations,
  promotions,
  promotionsRelations,
} from "./catalog";
import { tableSessions, tableSessionsRelations, tables, tablesRelations } from "./locations";
import {
  orderCounters,
  orderItems,
  orderItemsRelations,
  orderStatusLogs,
  orderStatusLogsRelations,
  orders,
  ordersRelations,
  payments,
  paymentsRelations,
} from "./orders";
import {
  auditLogs,
  auditLogsRelations,
  kasirSyncLogs,
  kasirSyncLogsRelations,
  kasirSyncQueue,
  kasirSyncQueueRelations,
  settings,
  tableRequests,
  tableRequestsRelations,
} from "./operations";
import {
  sessions,
  sessionsRelations,
  userRecoveryCodes,
  userRecoveryCodesRelations,
  users,
  usersRelations,
} from "./users";

export * from "./catalog";
export * from "./common";
export * from "./enums";
export * from "./locations";
export * from "./operations";
export * from "./orders";
export * from "./users";

export const schema = {
  users,
  usersRelations,
  userRecoveryCodes,
  userRecoveryCodesRelations,
  sessions,
  sessionsRelations,
  categories,
  categoriesRelations,
  menuItems,
  menuItemsRelations,
  menuVariants,
  menuVariantsRelations,
  addons,
  addonsRelations,
  addonCategories,
  addonCategoriesRelations,
  menuItemAddons,
  menuItemAddonsRelations,
  promotions,
  promotionsRelations,
  promotionTargets,
  promotionTargetsRelations,
  tables,
  tablesRelations,
  tableSessions,
  tableSessionsRelations,
  orders,
  ordersRelations,
  orderCounters,
  orderItems,
  orderItemsRelations,
  orderStatusLogs,
  orderStatusLogsRelations,
  payments,
  paymentsRelations,
  tableRequests,
  tableRequestsRelations,
  kasirSyncQueue,
  kasirSyncQueueRelations,
  kasirSyncLogs,
  kasirSyncLogsRelations,
  settings,
  auditLogs,
  auditLogsRelations,
};
