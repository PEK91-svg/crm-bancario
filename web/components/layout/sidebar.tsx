"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
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
    Settings,
    Package,
    Landmark,
    PiggyBank,
    CreditCard,
    Wallet,
    TrendingUp,
    Zap,
    FileEdit,
    ChevronDown,
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

const productItems = [
    { href: "/prodotti/conti-correnti", icon: Landmark, label: "Conti Correnti" },
    { href: "/prodotti/conti-deposito", icon: PiggyBank, label: "Conti Deposito" },
    { href: "/prodotti/carte-credito", icon: CreditCard, label: "Carte di Credito" },
    { href: "/prodotti/carte-debito", icon: CreditCard, label: "Carte di Debito" },
    { href: "/prodotti/carte-prepagate", icon: Wallet, label: "Carte Prepagate" },
    { href: "/prodotti/american-express", icon: CreditCard, label: "American Express" },
    { href: "/prodotti/linee-libere", icon: TrendingUp, label: "Linee Libere" },
    { href: "/prodotti/illimity-connect", icon: Zap, label: "illimity Connect" },
    { href: "/prodotti/modifiche-massive", icon: FileEdit, label: "Modifiche Massive" },
]

export function Sidebar() {
    const pathname = usePathname()
    const [productsOpen, setProductsOpen] = useState(pathname.startsWith('/prodotti'))

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

            <nav className="space-y-1 p-4 mt-4 overflow-y-auto max-h-[calc(100vh-180px)]">
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

                {/* Gestione Prodotti Section */}
                <div className="pt-3 mt-3 border-t border-white/5">
                    <button
                        onClick={() => setProductsOpen(!productsOpen)}
                        className={cn(
                            "w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                            pathname.startsWith('/prodotti')
                                ? "text-white bg-white/5"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <Package className={cn("h-5 w-5 transition-colors", pathname.startsWith('/prodotti') ? "text-cyan-400" : "group-hover:text-cyan-400/80")} />
                        <span className="flex-1 text-left">Gestione Prodotti</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence initial={false}>
                        {productsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                                    {productItems.map((item) => {
                                        const isActive = pathname === item.href

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all",
                                                    isActive
                                                        ? "text-white bg-white/10 border border-white/15"
                                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                <item.icon className={cn("h-4 w-4 transition-colors flex-shrink-0", isActive ? "text-cyan-400" : "group-hover:text-cyan-400/80")} />
                                                <span className="truncate">{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
