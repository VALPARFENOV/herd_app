import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="lg:pl-64">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
