import { Boxes } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="space-y-4 pb-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <Boxes className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <CardTitle>HalalChain</CardTitle>
          <CardDescription>
            Halal Supply Chain Management Platform
            <br />
            <span className="text-caption text-brand">
              Southeast Asian trade networks
            </span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
