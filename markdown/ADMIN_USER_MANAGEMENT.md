# Admin User Management — HalalChain

Tài liệu này mô tả toàn bộ flow quản lý user từ góc độ Admin, bao gồm schema DB, API endpoints, authentication/authorization, và các component frontend liên quan.

---

## 1. Database Schema

### `users` table

| Column           | Type          | Ghi chú |
|------------------|---------------|---------|
| `id`             | UUID          | Primary key |
| `name`           | String        | Tên hiển thị |
| `email`          | String        | Unique |
| `password_hash`  | String        | bcrypt cost 12 |
| `role`           | `UserRole`    | ADMIN / MANAGER / STAFF |
| `status`         | `UserStatus`  | ACTIVE / SUSPENDED — mặc định ACTIVE |
| `avatar_url`     | String?       | Cloudinary secure URL |
| `avatar_public_id` | String?     | Cloudinary public_id để xóa ảnh cũ |
| `is_verified`    | Boolean       | Badge xác minh — mặc định false |
| `last_login_at`  | DateTime?     | Cập nhật mỗi lần đăng nhập thành công |
| `token_version`  | Int           | Dùng để invalidate JWT — mặc định 0 |
| `created_at`     | DateTime      | Auto |

### `user_invitations` table

| Column        | Type       | Ghi chú |
|---------------|------------|---------|
| `id`          | UUID       | Primary key |
| `email`       | String     | Email được mời |
| `role`        | `UserRole` | Role sẽ được gán khi accept |
| `token`       | String     | Unique, 32-byte random hex |
| `invited_by`  | UUID       | FK → users.id |
| `accepted_at` | DateTime?  | Null nếu chưa accept |
| `expires_at`  | DateTime   | TTL 48 giờ kể từ lúc tạo |
| `created_at`  | DateTime   | Auto |

---

## 2. Authentication & Authorization

### JWT Cookie

- Tên cookie: `halalchain_token`
- Payload:

```ts
interface JwtPayload {
  sub: string;     // user.id
  email: string;
  role: UserRole;
  name: string;
  tv: number;      // tokenVersion — để invalidate sessions
}
```

- TTL mặc định: **7 ngày** (env `JWT_EXPIRES_IN`)

### `authenticate` middleware

Mỗi request protected đều qua đây. Ngoài verify chữ ký JWT, middleware còn hit DB để kiểm tra thêm 2 điều:

```
JWT hợp lệ?
  └─ user.status === SUSPENDED? → 403
  └─ user.tokenVersion !== token.tv? → 401 (session expired)
  └─ OK → req.user = payload → next()
```

> **Tại sao cần DB hit?**  
> JWT có TTL 7 ngày. Nếu không check DB, khi admin suspend một user hoặc reset password của họ, token cũ vẫn còn hợp lệ đến hết 7 ngày. `tokenVersion` giải quyết vấn đề này mà không cần Redis.

### `authorize(...roles)` middleware

Kiểm tra `req.user.role` có nằm trong danh sách roles được phép không. Dùng sau `authenticate`.

### Khi nào `tokenVersion` bị increment?

| Sự kiện | Increment |
|---------|-----------|
| Admin suspend user | ✅ |
| Admin reset password của user | ✅ |
| User tự đổi password | ✅ |

---

## 3. API Endpoints

Tất cả routes admin đều cần `authenticate + authorize(ADMIN)`.

### Admin User Routes — `/api/admin/users`

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/api/admin/users` | Danh sách users, có pagination + filter |
| `GET` | `/api/admin/users/stats` | Aggregate counts cho stat cards |
| `GET` | `/api/admin/users/:id` | Chi tiết một user |
| `PATCH` | `/api/admin/users/:id` | Đổi tên hiển thị |
| `POST` | `/api/admin/users/:id/avatar` | Upload avatar lên Cloudinary |
| `PATCH` | `/api/admin/users/:id/verify` | Toggle verified badge |
| `PATCH` | `/api/admin/users/:id/status` | Suspend / Activate |
| `POST` | `/api/admin/users/:id/reset-password` | Reset password (không cần password cũ) |

### Role Change Route — `/api/auth`

| Method | Path | Mô tả |
|--------|------|-------|
| `PATCH` | `/api/auth/users/:id/role` | Đổi role — cần ADMIN, có audit log |

> Route này nằm trong `auth.ts` vì lịch sử, nhưng cũng được bảo vệ bởi `authorize(ADMIN)` và có audit log đầy đủ.

### Invitation Routes — `/api/invitations`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/invitations` | ADMIN | Tạo invite link mới (TTL 48h) |
| `GET` | `/api/invitations` | ADMIN | Danh sách invitations đang pending |
| `DELETE` | `/api/invitations/:id` | ADMIN | Thu hồi một invitation |
| `GET` | `/api/invitations/validate?token=` | Public | Kiểm tra token có hợp lệ không |
| `POST` | `/api/invitations/accept` | Public | User nhận invite, tạo account |

#### Chi tiết `GET /api/admin/users` — Query params

```
?page=1          # mặc định 1
&limit=10        # mặc định 20, tối đa 100
&search=john     # tìm theo name hoặc email (case-insensitive)
&role=STAFF      # ADMIN | MANAGER | STAFF
&status=ACTIVE   # ACTIVE | SUSPENDED
```

Response:
```json
{
  "users": [...],
  "page": 1,
  "limit": 10,
  "total": 42,
  "totalPages": 5
}
```

#### Chi tiết `GET /api/admin/users/stats`

> **Lưu ý routing:** Route `/stats` phải được khai báo **trước** `/:id` trong Express, nếu không Express sẽ parse "stats" như một UUID và trả về 404. Hiện tại đã đúng thứ tự.

Response:
```json
{
  "stats": {
    "total": 42,
    "active": 38,
    "suspended": 4,
    "unverified": 12,
    "byRole": { "admins": 2, "managers": 5, "staff": 35 }
  }
}
```

#### Chi tiết `POST /api/admin/users/:id/avatar`

Flow upload ảnh:
```
Frontend gửi multipart/form-data
  → multer (memoryStorage) parse → req.file.buffer
  → uploadAvatarToCloudinary(buffer, mimeType)
      • folder: "avatars"
      • auto-convert sang WebP
      • crop 256×256 face-aware
  → Lưu { avatarUrl, avatarPublicId } vào DB (transaction + audit log)
  → Xóa ảnh cũ trên Cloudinary (non-blocking, nếu có publicId)
```

Giống hoàn toàn với self-service `/api/profile/avatar`.

#### Chi tiết `PATCH /api/admin/users/:id/status`

```json
// Request body
{ "status": "SUSPENDED" }  // hoặc "ACTIVE"

// Khi SUSPENDED:
// - tokenVersion tăng 1 → token cũ bị invalidate ngay lập tức
// - User bị đẩy ra khỏi session khi request tiếp theo
```

Guard: Admin không thể suspend chính mình (`targetId === adminId` → 400).

---

## 4. Invite Flow — Chi tiết

```
Admin nhập email + role → POST /api/invitations
  └─ Xóa invitations cũ chưa accepted của email đó
  └─ Tạo token = crypto.randomBytes(32).toString('hex')
  └─ expiresAt = now + 48h
  └─ Trả về inviteUrl: /accept-invite?token=<token>
  └─ Admin copy link và gửi cho người được mời

Người nhận mở link /accept-invite?token=...
  └─ GET /api/invitations/validate?token=... → lấy email + role
  └─ Hiển thị form: nhập name + password
  └─ POST /api/invitations/accept { token, name, password }
      └─ Validate password complexity
      └─ Transaction:
          • Tạo User mới với email + role từ invitation
          • Đánh dấu invitation.acceptedAt = now
          • Ghi audit log
      └─ Set JWT cookie → tự động đăng nhập
      └─ Redirect về /dashboard
```

> **Hiện tại chưa có email integration** — invite link được trả về trong response API để admin tự copy và gửi. Khi tích hợp email (SendGrid, Resend...), chỉ cần thêm `sendEmail(email, inviteUrl)` vào route POST trước khi return.

---

## 5. Audit Log

Tất cả actions admin đều được ghi vào bảng `audit_logs` trong cùng transaction với thao tác chính:

| Action | `entityType` | `oldData` | `newData` |
|--------|-------------|-----------|-----------|
| Đổi tên | `User` | `{ name: "cũ" }` | `{ name: "mới" }` |
| Upload avatar | `User` | `{ avatarUrl: "cũ" }` | `{ avatarUrl: "mới" }` |
| Toggle verify | `User` | `{ isVerified: false }` | `{ isVerified: true }` |
| Suspend/Activate | `User` | `{ status: "ACTIVE" }` | `{ status: "SUSPENDED" }` |
| Đổi role | `User` | `{ role: "STAFF" }` | `{ role: "MANAGER" }` |
| Reset password | `User` | `null` | `{ event: "password_reset_by_admin" }` |
| Tạo invitation | `UserInvitation` | `null` | `{ email, role }` |
| Xóa invitation | `UserInvitation` | `{ email }` | `null` |

---

## 6. Frontend Files

### Pages

| File | Mô tả |
|------|-------|
| `src/app/dashboard/users/page.tsx` | Trang chính quản lý users |
| `src/app/accept-invite/page.tsx` | Trang nhận invitation, set password |

### Components

| File | Mô tả |
|------|-------|
| `src/components/modules/user-detail-drawer.tsx` | Sheet mở từ phải — quản lý chi tiết một user |
| `src/components/modules/invite-user-dialog.tsx` | Dialog tạo invitation + list pending invites |

### API Client

Tất cả calls đều trong `src/lib/api.ts`:

```ts
api.adminGetUserStats()
api.adminListUsers({ page, limit, search, role, status })
api.adminGetUser(id)
api.adminUpdateUser(id, { name })
api.adminUploadAvatar(id, file)
api.adminVerifyUser(id, isVerified)
api.adminChangeRole(id, role)
api.adminSetStatus(id, status)           // ACTIVE | SUSPENDED
api.adminResetPassword(id, { newPassword })

api.adminCreateInvitation({ email, role })
api.adminListInvitations()
api.adminRevokeInvitation(id)
api.validateInviteToken(token)           // public
api.acceptInvitation({ token, name, password })  // public
```

---

## 7. Users Page — UI Overview

```
┌──────────────────────────────────────────────────────┐
│ User Management                  [Refresh] [Invite]  │
├──────────────────────────────────────────────────────┤
│  42 Total │  38 Active │  4 Suspended │  12 Unverified│  ← stat cards
├──────────────────────────────────────────────────────┤
│ [Search...] [All roles ▾] [All statuses ▾]           │  ← server-side filters
├──────────────────────────────────────────────────────┤
│ User        │ Email     │ Role   │ Status │ Last Login│
│─────────────────────────────────────────────────────│
│ 👤 John Doe │ john@...  │ Staff  │ Active │ Jun 10   │ → click → drawer
│ ...         │           │        │        │           │
├──────────────────────────────────────────────────────┤
│ Page 1 of 5 · 42 users          [← Prev] [Next →]   │
└──────────────────────────────────────────────────────┘
```

### User Detail Drawer (mở khi click row hoặc "Manage")

```
┌─────────────────────────────┐
│ User Details                │ ✕
│ Manage account for John Doe │
├─────────────────────────────┤
│ [Avatar] John Doe           │
│          john@example.com   │
│          [Staff] [Verified] │
│                    [Photo]  │
├─────────────────────────────┤
│ 👤 Display Name             │
│ [John Doe________________]  │
│                  [Save Name]│
├─────────────────────────────┤
│ 🛡 Role                      │
│ [Warehouse Staff        ▾]  │
│                  [Save Role]│
├─────────────────────────────┤
│ ✅ Verification Status       │
│ Verified user     [Unverify]│
├─────────────────────────────┤
│ 🔑 Reset Password            │
│ [New password_____________] │
│             [Reset Password]│
├─────────────────────────────┤
│ 🚫 Account Status            │
│ Account active   [Suspend]  │
│ Last login: Jun 10, 2026    │
├─────────────────────────────┤
│ User ID: abc-123...         │
│ Joined: January 5, 2026     │
└─────────────────────────────┘
```

---

## 8. Security Notes

- **Password hashing:** bcrypt cost 12
- **JWT secret:** env `JWT_SECRET` — phải thay đổi trong production
- **Suspend immediate effect:** `tokenVersion` tăng khi suspend → user bị kick ra ngay lập tức ở request tiếp theo, không cần chờ token expire
- **Self-action guards:**
  - Admin không thể suspend chính mình
  - Admin không thể đổi role của chính mình (frontend guard)
  - Admin không thể thay đổi verified status của chính mình (frontend guard)
- **Invitation token:** 32-byte random hex = 256-bit entropy, không thể brute-force
- **Avatar upload:** File không bao giờ lưu xuống disk — chỉ tồn tại trong memory buffer rồi stream thẳng lên Cloudinary

---

## 9. Migrations liên quan

| Migration | Nội dung |
|-----------|---------|
| `20260617000000_add_user_status_and_last_login` | Thêm `status`, `last_login_at`, `token_version` vào `users` |
| `20260617100000_add_user_invitations` | Tạo bảng `user_invitations` |
