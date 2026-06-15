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
    profile: (email: string) => `/users/profile/${encodeURIComponent(email)}`,
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
    detail: (id: string) => `/majors/${id}/detail`,
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
    detail: (id: string) => `/subjects/${id}/detail`,
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

  conversations: {
    list: "/conversations",
    start: "/conversations",
    getById: (id: string) => `/conversations/${id}`,
    messages: (id: string) => `/conversations/${id}/messages`,
  },

  tickets: {
    list: "/tickets",
    create: "/tickets",
    getById: (id: string) => `/tickets/${id}`,
    status: (id: string) => `/tickets/${id}/status`,
    messages: (id: string) => `/tickets/${id}/messages`,
  },

  rooms: {
    list: "/rooms",
    create: "/rooms",
    getById: (id: string) => `/rooms/${id}`,
    deleteById: (id: string) => `/rooms/${id}`,
    posts: (id: string) => `/rooms/${id}/posts`,
    getPost: (id: string, postId: string) => `/rooms/${id}/posts/${postId}`,
    deletePost: (id: string, postId: string) => `/rooms/${id}/posts/${postId}`,
    likePost: (id: string, postId: string) => `/rooms/${id}/posts/${postId}/like`,
    comments: (id: string, postId: string) => `/rooms/${id}/posts/${postId}/comments`,
    deleteComment: (id: string, postId: string, commentId: string) =>
      `/rooms/${id}/posts/${postId}/comments/${commentId}`,
    pins: (id: string) => `/rooms/${id}/pins`,
    pin: (id: string, postId: string) => `/rooms/${id}/pins/${postId}`,
    unpin: (id: string, postId: string) => `/rooms/${id}/pins/${postId}`,
    mutes: (id: string) => `/rooms/${id}/mutes`,
    mute: (id: string, userId: string) => `/rooms/${id}/mute/${userId}`,
    unmute: (id: string, userId: string) => `/rooms/${id}/mute/${userId}`,
  },

  assessments: {
    list: "/assessments",
    create: "/assessments",
    getById: (id: string) => `/assessments/${id}`,
    updateById: (id: string) => `/assessments/${id}`,
    deleteById: (id: string) => `/assessments/${id}`,
    questions: (id: string) => `/assessments/${id}/questions`,
    question: (id: string, qId: string) => `/assessments/${id}/questions/${qId}`,
    submissions: (id: string) => `/assessments/${id}/submissions`,
    gradeSubmission: (id: string, sId: string) => `/assessments/${id}/submissions/${sId}/mark`,
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
