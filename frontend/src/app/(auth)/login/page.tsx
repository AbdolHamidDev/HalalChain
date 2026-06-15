import Image from "next/image";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="space-y-6 text-center">
        <div className="flex justify-center">
          <Image
            src="/icon1.png"
            alt="HalalChain"
            width={64}
            height={64}
            priority
            className="h-16 w-16 object-contain"
          />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            HalalChain
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}