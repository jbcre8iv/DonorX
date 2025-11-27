import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

export const metadata = {
  title: "Pending Approval - DonorX",
};

export default async function PendingApprovalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is approved - if so, redirect to dashboard
  const { data: userData } = await supabase
    .from("users")
    .select("status, first_name")
    .eq("id", user.id)
    .single();

  if (userData?.status === "approved") {
    redirect("/dashboard");
  }

  if (userData?.status === "rejected") {
    // Show rejected message
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-slate-900">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              Your account request has been reviewed and was not approved.
              If you believe this is an error, please contact the platform
              administrator.
            </p>
            <form action={logout}>
              <Button type="submit" variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl text-slate-900">
            Account Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            Thank you for registering{userData?.first_name ? `, ${userData.first_name}` : ""}!
            Your account is currently pending approval by the platform owner.
          </p>
          <p className="text-sm text-slate-500">
            You will be able to access the platform once your account has been
            approved. Please check back later or contact your administrator if
            you have questions.
          </p>
          <div className="pt-4">
            <form action={logout}>
              <Button type="submit" variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
