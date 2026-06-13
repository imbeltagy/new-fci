export enum Permission {
  USERS_READ = "users:read",
  USERS_CREATE = "users:create",
  USERS_UPDATE = "users:update",
  USERS_DEACTIVATE = "users:deactivate",
  USERS_DELETE = "users:delete",
  ACCESS_GROUPS_MANAGE = "access_groups:manage",
  TICKETS_MANAGE = "tickets:manage",
  ANNOUNCEMENTS_MANAGE = "announcements:manage",
  CHANNELS_MODERATE = "channels:moderate",
  SUBJECTS_MANAGE = "subjects:manage",
  MAJORS_MANAGE = "majors:manage",
}

export interface PermissionGroup {
  label: string;
  actions: { label: string; value: Permission }[];
}

export const permissionsConfig: Record<string, PermissionGroup> = {
  users: {
    label: "Users",
    actions: [
      { label: "Read", value: Permission.USERS_READ },
      { label: "Create", value: Permission.USERS_CREATE },
      { label: "Update", value: Permission.USERS_UPDATE },
      { label: "Deactivate", value: Permission.USERS_DEACTIVATE },
      { label: "Delete", value: Permission.USERS_DELETE },
    ],
  },
  accessGroups: {
    label: "Access Groups",
    actions: [{ label: "Manage", value: Permission.ACCESS_GROUPS_MANAGE }],
  },
  tickets: {
    label: "IT Tickets",
    actions: [{ label: "Manage", value: Permission.TICKETS_MANAGE }],
  },
  announcements: {
    label: "Announcements",
    actions: [{ label: "Manage", value: Permission.ANNOUNCEMENTS_MANAGE }],
  },
  channels: {
    label: "Channels & Community",
    actions: [{ label: "Moderate", value: Permission.CHANNELS_MODERATE }],
  },
  subjects: {
    label: "Subjects & Majors",
    actions: [
      { label: "Manage Subjects", value: Permission.SUBJECTS_MANAGE },
      { label: "Manage Majors", value: Permission.MAJORS_MANAGE },
    ],
  },
};

export interface AccessGroupPermission {
  id: string;
  key: string;
}

export interface AccessGroup {
  id: string;
  name: string;
  description: string | null;
  permissions: AccessGroupPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccessGroupBody {
  name: string;
  description?: string;
  permissionKeys: string[];
}

export interface UpdateAccessGroupBody {
  name?: string;
  description?: string;
  permissionKeys?: string[];
}
