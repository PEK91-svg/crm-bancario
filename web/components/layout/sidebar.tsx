"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Briefcase,
    BarChart3,
    Globe,
    Building2,
    AlertCircle,
    Target,
    Settings
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/customers", icon: Users, label: "Clienti" },
    { href: "/accounts", icon: Building2, label: "Conti" },
    { href: "/projects", icon: Target, label: "Progetti" },
    { href: "/cases", icon: AlertCircle, label: "Supporto" },
    { href: "/communications", icon: MessageSquare, label: "Comunicazioni" },
    { href: "/journeys", icon: Globe, label: "Marketing" },
    { href: "/pratiche", icon: Briefcase, label: "Pratiche" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/settings", icon: Settings, label: "Impostazioni" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden w-64 border-r border-white/5 bg-card/30 backdrop-blur-xl lg:block fixed inset-y-0 left-0 z-50 shadow-2xl"
        >
            <div className="flex h-16 items-center border-b border-white/5 px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-cyan-500/20">
                        CB
                    </div>
                    CRM Bancario
                </Link>
            </div>

            <nav className="space-y-1 p-4 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative overflow-hidden",
                                isActive
                                    ? "text-white shadow-lg shadow-primary/20 backdrop-blur-md bg-white/10 border border-white/20"
                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-cyan-400" : "group-hover:text-cyan-400/80")} />
                            <span className="relative z-10">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Info Card at Bottom */}
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center gap-3 shadow-lg backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    GP
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">Gaetano P.</p>
                    <p className="text-xs text-muted-foreground truncate">Private Banker</p>
                </div>
            </div>
        </motion.aside>
    )
}
