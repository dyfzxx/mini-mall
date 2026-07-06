import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>欢迎回到 Mini Mall</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData: FormData) => {
            "use server";
            const redirectPath = formData.get("redirect") as string || "/";
            await login(formData);
            redirect(redirectPath);
          }} className="space-y-4">
            <input type="hidden" name="redirect" value={redirectTo || "/"} />
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="请输入邮箱" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="请输入密码" required />
            </div>
            <Button type="submit" className="w-full">登录</Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            还没有账户? <Link href="/register" className="text-primary hover:underline">去注册</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
