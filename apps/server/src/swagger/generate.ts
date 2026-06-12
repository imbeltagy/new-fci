import "dotenv/config";
import swaggerAutogen from "swagger-autogen";

const creatableRoles = ["student", "teacher", "sub-teacher", "it"];

const doc = {
  info: {
    title: "Server API",
    description: "Auto-generated API documentation (swagger-autogen)",
  },
  host: `localhost:${process.env.PORT ?? 4000}`,
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "JWT access token. Value format: Bearer <token>",
    },
    csrfToken: {
      type: "apiKey",
      in: "header",
      name: "X-CSRF-Token",
      description:
        "Required for mutating admin (cookie-session) requests. Read from the csrf_token cookie after admin login.",
    },
  },
  security: [{ bearerAuth: [] }, { csrfToken: [] }],
  definitions: {
    // ── Auth ────────────────────────────────────────────────────────────────
    LoginDto: {
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "user@fci.edu" },
        password: { type: "string", minLength: 8, example: "Secret@123" },
      },
    },
    ClientRefreshDto: {
      required: ["refreshToken"],
      properties: {
        refreshToken: { type: "string" },
      },
    },
    RequestPasswordResetDto: {
      required: ["email"],
      properties: {
        email: { type: "string", format: "email", example: "user@fci.edu" },
      },
    },
    ConfirmPasswordResetDto: {
      required: ["token", "newPassword"],
      properties: {
        token: { type: "string" },
        newPassword: { type: "string", minLength: 8, example: "NewPass@123" },
      },
    },
    ChangePasswordDto: {
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: { type: "string", example: "OldPass@123" },
        newPassword: { type: "string", minLength: 8, example: "NewPass@123" },
      },
    },
    // ── Users ────────────────────────────────────────────────────────────────
    CreateUserDto: {
      required: ["email", "name", "role"],
      properties: {
        email: { type: "string", format: "email", example: "student@fci.edu" },
        name: { type: "string", example: "Ahmed Hassan" },
        role: { type: "string", enum: creatableRoles },
        joinYearId: { type: "string" },
        majorId: { type: "string" },
      },
    },
    CreateManyUsersDto: {
      required: ["users"],
      properties: {
        users: {
          type: "array",
          items: { $ref: "#/definitions/CreateUserDto" },
        },
      },
    },
    UpdateMeDto: {
      properties: {
        name: { type: "string" },
        avatarUrl: { type: "string" },
        coverUrl: { type: "string" },
        whatsapp: { type: "string" },
      },
    },
    SendCredentialsDto: {
      required: ["userIds"],
      properties: {
        userIds: { type: "array", items: { type: "string", format: "uuid" } },
      },
    },
    UpdateUserDto: {
      properties: {
        role: { type: "string", enum: creatableRoles },
        isActive: { type: "boolean" },
        joinYearId: { type: "string" },
        majorId: { type: "string" },
        accessGroupId: { type: "string", format: "uuid", "x-nullable": true },
      },
    },
    // ── Access Groups ─────────────────────────────────────────────────────────
    CreateAccessGroupDto: {
      required: ["name", "permissionKeys"],
      properties: {
        name: { type: "string", example: "Content Managers" },
        description: { type: "string" },
        permissionKeys: {
          type: "array",
          items: { type: "string" },
          example: ["users:read", "announcements:manage"],
        },
      },
    },
    UpdateAccessGroupDto: {
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        permissionKeys: { type: "array", items: { type: "string" } },
      },
    },
  },
};

const outputFile = "./src/swagger/swagger-output.json";
const endpointsFiles = ["./src/index.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
