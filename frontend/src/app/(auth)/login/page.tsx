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
    <Card className="shadow-xl">
      <CardHeader className="space-y-4 text-center pb-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <Boxes className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">HalalChain</CardTitle>
          <CardDescription>
            Halal Supply Chain Management Platform
            <br />
            <span className="text-xs">Southeast Asian trade networks</span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
