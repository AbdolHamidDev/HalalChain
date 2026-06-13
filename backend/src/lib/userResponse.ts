import { UserRole } from "@prisma/client";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  avatarUrl: string | null;
}

export function buildUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  avatarUrl?: string | null;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl ?? null,
  };
}
