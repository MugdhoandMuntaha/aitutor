import { redirect } from "next/navigation";
import { getCurrentUser, requireWorkspace } from "@/core/auth/session";
import { getUserWorkspaces } from "@/features/workspaces/actions/workspace-actions";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FloatingPomodoro } from "@/components/pomodoro-floating";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let workspaceContext;
  try {
    workspaceContext = await requireWorkspace();
  } catch {
    redirect("/onboarding");
  }

  const allWorkspaces = await getUserWorkspaces();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row">
      {/* Fixed Sticky Sidebar */}
      <Sidebar
        currentWorkspace={{
          id: workspaceContext.workspaceId,
          name: workspaceContext.workspaceName,
          mode: workspaceContext.workspaceMode,
          role: workspaceContext.role,
        }}
        workspaces={allWorkspaces}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
            role: workspaceContext.role,
          }}
          workspace={{
            id: workspaceContext.workspaceId,
            mode: workspaceContext.workspaceMode,
          }}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Floating Pomodoro Widget */}
      <FloatingPomodoro />
    </div>
  );
}
