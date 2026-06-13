import { Boxes } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="space-y-4 pb-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <Boxes className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <CardTitle>Tạo tài khoản</CardTitle>
          <CardDescription>
            Tham gia Halal Supply Hub để quản lý nhà cung cấp và tồn kho
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
