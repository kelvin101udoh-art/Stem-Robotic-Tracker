// /web/src/lib/routes/roleRedirect.ts
export type UserRole = "club_admin" | "teacher" | "student" | "parent";

export function routeForRole(role: UserRole) {
  switch (role) {
    case "club_admin":
      return "/app/admin";
    case "teacher":
      return "/app/teacher";
    case "student":
      return "/app/student";
    case "parent":
      return "/app/parent";
    default:
      return "/app";
  }
}
