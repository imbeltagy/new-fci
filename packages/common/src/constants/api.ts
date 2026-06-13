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
    mySubjects: "/users/me/subjects",
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

  joinYears: {
    list: "/join-years",
    create: "/join-years",
    getById: (id: string) => `/join-years/${id}`,
    updateById: (id: string) => `/join-years/${id}`,
    deleteById: (id: string) => `/join-years/${id}`,
  },

  majors: {
    list: "/majors",
    create: "/majors",
    getById: (id: string) => `/majors/${id}`,
    updateById: (id: string) => `/majors/${id}`,
    deleteById: (id: string) => `/majors/${id}`,
    staff: (majorId: string) => `/majors/${majorId}/staff`,
    staffMember: (majorId: string, userId: string, joinYearId: string) =>
      `/majors/${majorId}/staff/${userId}/${joinYearId}`,
  },

  subjects: {
    list: "/subjects",
    create: "/subjects",
    getById: (id: string) => `/subjects/${id}`,
    updateById: (id: string) => `/subjects/${id}`,
    deleteById: (id: string) => `/subjects/${id}`,
    staff: (subjectId: string) => `/subjects/${subjectId}/staff`,
    staffMember: (subjectId: string, userId: string) => `/subjects/${subjectId}/staff/${userId}`,
    enrollments: (subjectId: string) => `/subjects/${subjectId}/enrollments`,
    enrollmentsBulk: (subjectId: string) => `/subjects/${subjectId}/enrollments/bulk`,
    enrollStudent: (subjectId: string, userId: string) => `/subjects/${subjectId}/enrollments/${userId}`,
    unenrollStudent: (subjectId: string, userId: string) => `/subjects/${subjectId}/enrollments/${userId}`,
  },

  assignments: {
    get: (userId: string) => `/users/${userId}/assignments`,
    assignJoinYear: (userId: string, joinYearId: string) =>
      `/users/${userId}/assignments/join-years/${joinYearId}`,
    removeJoinYear: (userId: string, joinYearId: string) =>
      `/users/${userId}/assignments/join-years/${joinYearId}`,
    assignMajor: (userId: string) => `/users/${userId}/assignments/majors`,
    removeMajor: (userId: string, majorId: string, joinYearId: string) =>
      `/users/${userId}/assignments/majors/${majorId}/${joinYearId}`,
    assignSubject: (userId: string, subjectId: string) =>
      `/users/${userId}/assignments/subjects/${subjectId}`,
    removeSubject: (userId: string, subjectId: string) =>
      `/users/${userId}/assignments/subjects/${subjectId}`,
  },
} as const;
