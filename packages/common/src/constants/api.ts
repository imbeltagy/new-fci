export const API_ROUTES = {
  healthcheck: "/healthcheck",

  auth: {
    clientLogin: "/auth/login",
    adminLogin: "/auth/admin/login",
    clientRefresh: "/auth/refresh",
    adminRefresh: "/auth/admin/refresh",
    adminLogout: "/auth/admin/logout",
    requestPasswordReset: "/auth/password-reset/request",
    confirmPasswordReset: "/auth/password-reset/confirm",
    changePassword: "/auth/change-password",
    adminChangePassword: "/auth/admin/change-password",
  },

  users: {
    list: "/users",
    create: "/users",
    bulk: "/users/bulk",
    me: "/users/me",
    updateMe: "/users/me",
    sendCredentials: "/users/send-credentials",
    getById: (id: string) => `/users/${id}`,
    updateById: (id: string) => `/users/${id}`,
    deleteById: (id: string) => `/users/${id}`,
  },

  accessGroups: {
    list: "/access-groups",
    create: "/access-groups",
    getById: (id: string) => `/access-groups/${id}`,
    updateById: (id: string) => `/access-groups/${id}`,
    deleteById: (id: string) => `/access-groups/${id}`,
  },
} as const;
