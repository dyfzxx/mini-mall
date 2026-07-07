import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { getLevelLabel, type MembershipLevel } from "@/lib/membership";

const levelColors: Record<string, string> = {
  NONE: "",
  LEVEL1: "bg-blue-500",
  LEVEL2: "bg-purple-500",
  LEVEL3: "bg-yellow-500",
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">用户名</th>
              <th className="text-left p-3">邮箱</th>
              <th className="text-left p-3">角色</th>
              <th className="text-left p-3">会员等级</th>
              <th className="text-left p-3">累计消费</th>
              <th className="text-left p-3">订单数</th>
              <th className="text-left p-3">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.id}</td>
                <td className="p-3 font-medium">{user.name}</td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role === "ADMIN" ? "管理员" : "用户"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge className={levelColors[user.membershipLevel] || ""}>
                    {getLevelLabel(user.membershipLevel as MembershipLevel)}
                  </Badge>
                </td>
                <td className="p-3">¥{user.totalSpent.toFixed(2)}</td>
                <td className="p-3">{user._count.orders}</td>
                <td className="p-3 text-muted-foreground">{user.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
