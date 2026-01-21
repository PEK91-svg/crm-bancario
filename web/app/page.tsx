"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
    ArrowUpRight,
    Users,
    Briefcase,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Activity
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

const data = [
    { name: 'Lun', value: 400 },
    { name: 'Mar', value: 300 },
    { name: 'Mer', value: 550 },
    { name: 'Gio', value: 450 },
    { name: 'Ven', value: 650 },
    { name: 'Sab', value: 400 },
    { name: 'Dom', value: 500 },
]

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

export default function Dashboard() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Bentornato, Gaetano
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Ecco una panoramica delle tue attività oggi.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-500">Sistemi Operativi</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pratiche Aperte
                            </CardTitle>
                            <Briefcase className="h-4 w-4 text-cyan-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">42</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+12%</span>
                                <span className="ml-1">dal mese scorso</span>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Nuovi Clienti
                            </CardTitle>
                            <Users className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">+18</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                <span className="text-green-500 font-medium">+4%</span>
                                <span className="ml-1">questa settimana</span>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                SLA Breached
                            </CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">3</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <Activity className="h-3 w-3 text-red-500 mr-1" />
                                <span className="text-red-500 font-medium">Attenzione richiesta</span>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Journey Attive
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">7</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <CheckCircle2 className="h-3 w-3 text-cyan-500 mr-1" />
                                <span className="text-cyan-500 font-medium">Tutte operative</span>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={itemVariants} className="col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Andamento Pratiche</CardTitle>
                            <CardDescription>
                                Nuove pratiche aperte negli ultimi 7 giorni
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#06b6d4"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Attività Recenti</CardTitle>
                            <CardDescription>
                                Ultime azioni registrate sul sistema
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {[
                                    { user: "Marco Rossi (Cliente)", action: "Ha aperto una nuova pratica mutuo", time: "2 min fa", icon: Briefcase, color: "text-blue-400" },
                                    { user: "Sistema", action: "SLA Check completato", time: "15 min fa", icon: Activity, color: "text-green-400" },
                                    { user: "Giulia Bianchi", action: "Ha inviato una mail a Cliente VIP", time: "1 ora fa", icon: Users, color: "text-purple-400" },
                                    { user: "Marketing Bot", action: "Campagna 'Welcome' iniziata", time: "3 ore fa", icon: TrendingUp, color: "text-cyan-400" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                            <item.icon className={`h-4 w-4 ${item.color}`} />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium text-white leading-none">{item.user}</p>
                                            <p className="text-xs text-muted-foreground">{item.action}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                                            {item.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}
