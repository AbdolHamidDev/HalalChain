import { UserRole, UserStatus } from "@prisma/client";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  avatarUrl: string | null;
  isVerified: boolean;
  lastLoginAt: Date | null;
}

export function buildUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  createdAt: Date;
  avatarUrl?: string | null;
  isVerified?: boolean;
  lastLoginAt?: Date | null;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status ?? UserStatus.ACTIVE,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl ?? null,
    isVerified: user.isVerified ?? false,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}
