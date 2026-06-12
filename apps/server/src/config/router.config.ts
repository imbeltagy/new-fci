import { Role } from "@prisma/client";

import { Permission } from "./permissions.config";

export interface RouteConfig {
  roles: Role[] | null;
  perms: Permission[] | null;
}

// Each node may carry a RouteConfig AND/OR child segment keys.
// Typed as `any` to avoid TypeScript index-signature conflicts; lookupRoute is the typed boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteNode = any;

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];
const anyAdmin: Role[] = [Role.it, Role.superadmin];
const anyUser: Role[] = [...anyClient, ...anyAdmin];

// Helpers to keep the tree readable
const pub = (): RouteConfig => ({ roles: null, perms: null });
const open = (roles: Role[]): RouteConfig => ({ roles, perms: null });
const guarded = (roles: Role[], perms: Permission[]): RouteConfig => ({
  roles,
  perms,
});

const routeTree: RouteNode = {
  healthcheck: pub(),

  auth: {
    login: pub(),
    refresh: pub(),
    admin: {
      login: pub(),
      refresh: pub(),
      logout: open(anyAdmin),
    },
    "password-reset": {
      request: pub(),
      confirm: pub(),
    },
    "change-password": open(anyUser),
  },

  users: {
    ...guarded(
      [Role.superadmin, Role.it],
      [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DEACTIVATE,
      ],
    ),
    me: open(anyUser),
    bulk: guarded([Role.superadmin, Role.it], [Permission.USERS_CREATE]),
    "send-credentials": guarded(
      [Role.superadmin, Role.it],
      [Permission.USERS_CREATE],
    ),
    ":id": {
      ...guarded(
        [Role.superadmin, Role.it],
        [
          Permission.USERS_READ,
          Permission.USERS_UPDATE,
          Permission.USERS_DEACTIVATE,
        ],
      ),
    },
  },

  "access-groups": {
    ...open([Role.superadmin]),
    ":id": open([Role.superadmin]),
  },

  "permissions-config": open([Role.superadmin]),
};

export function lookupRoute(pathname: string): RouteConfig | null {
  // Swagger UI and its assets are always public
  if (pathname.startsWith("/docs")) return pub();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  let node: RouteNode = routeTree;

  for (const segment of segments) {
    const next = (node[segment] ?? node[":id"]) as RouteNode | undefined;
    if (!next) return null;
    node = next;
  }

  // A node is a valid endpoint only when it carries explicit `roles`
  if (!("roles" in node)) return null;

  return { roles: node.roles ?? null, perms: node.perms ?? null };
}
