import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { register } from "@/actions/auth";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建您的 Mini Mall 账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={register} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">用户名</Label>
              <Input id="name" name="name" placeholder="请输入用户名" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="请输入邮箱" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="至少6位密码" required minLength={6} />
            </div>
            <Button type="submit" className="w-full">注册</Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            已有账户? <Link href="/login" className="text-primary hover:underline">去登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
