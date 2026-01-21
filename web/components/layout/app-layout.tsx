import { Sidebar } from "@/components/layout/sidebar"
import { CommandMenu } from "@/components/layout/command-menu"

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background min-h-screen">
            <Sidebar />
            <main className="lg:pl-64 min-h-screen">
                <div className="container mx-auto p-4 lg:p-8 pt-6 max-h-screen overflow-y-auto">
                    {children}
                </div>
            </main>
            <CommandMenu />
        </div>
    )
}
