import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { getSidebarCounters } from "@/lib/data/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export async function AppLayout({ children }: AppLayoutProps) {
  const sidebarData = await getSidebarCounters()

  return (
    <div className="relative min-h-screen bg-background">
      <Header />
      <Sidebar data={sidebarData} />
      <main className="lg:pl-64">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
