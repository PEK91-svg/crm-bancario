"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    User, Phone, Mail, MapPin, Calendar,
    Briefcase, MessageSquare, CreditCard,
    ArrowUpRight, ArrowDownLeft, ShieldCheck
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams } from "next/navigation"
import { DeleteButton } from "@/components/shared/DeleteButton"

export default function CustomerDetailPage() {
    const { id } = useParams()

    const { data: customer, isLoading } = useQuery({
        queryKey: ['contacts', id],
        queryFn: () => api.get(`contacts/${id}`).json<any>()
    })

    const { data: accounts } = useQuery({
        queryKey: ['accounts', id],
        queryFn: () => api.get(`accounts?contactId=${id}`).json<any[]>()
    })

    if (isLoading) return <CustomerSkeleton />

    return (
        <div className="space-y-6">
            {/* Header Profile */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 p-8">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <User className="h-64 w-64 text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-emerald-900/50 border-4 border-white/10">
                        {customer?.firstName?.[0]}{customer?.lastName?.[0]}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-bold text-white">{customer?.firstName} {customer?.lastName}</h1>
                                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 px-3 py-1">
                                    Premium Client
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> KYC Verified • Member since 2021
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                                <div className="p-2 rounded-lg bg-white/5"><Phone className="h-4 w-4" /></div>
                                {customer?.phone || '+39 333 1234567'}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <div className="p-2 rounded-lg bg-white/5"><Mail className="h-4 w-4" /></div>
                                {customer?.email}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <div className="p-2 rounded-lg bg-white/5"><MapPin className="h-4 w-4" /></div>
                                Milano, Italia
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[150px]">
                        <Button className="w-full bg-cyan-600 hover:bg-cyan-500">Contact</Button>
                        <Button variant="outline" className="w-full">Edit Profile</Button>
                        <DeleteButton
                            entityType="contact"
                            entityId={id as string}
                            entityName={`${customer?.firstName} ${customer?.lastName}`}
                            redirectTo="/customers"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-white/5 rounded-none p-0 h-auto mb-6">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none pb-4 px-6 text-base">Overview</TabsTrigger>
                    <TabsTrigger value="financials" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none pb-4 px-6 text-base">Financials</TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none pb-4 px-6 text-base">Activity Log</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Financial Snapshot */}
                        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-black border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-cyan-500" /> Financial Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-sm text-muted-foreground">Total Assets</p>
                                        <p className="text-2xl font-bold text-white mt-1">€ 1.245.000,00</p>
                                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> +12% YTD</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-sm text-muted-foreground">Liabilities</p>
                                        <p className="text-2xl font-bold text-white mt-1">€ 340.000,00</p>
                                        <p className="text-xs text-gray-400 mt-2">Mortgage ending 2035</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Pratiche */}
                        <Card className="bg-card/20 border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-500" /> Active Cases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div>
                                            <p className="font-medium text-white">Mutuo Casa</p>
                                            <p className="text-xs text-muted-foreground">Due: 24 Jan</p>
                                        </div>
                                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Processing</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div>
                                            <p className="font-medium text-white">KYC Update</p>
                                            <p className="text-xs text-muted-foreground">Due: 30 Jan</p>
                                        </div>
                                        <Badge variant="outline" className="border-blue-500/50 text-blue-500">New</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Communications */}
                    <Card className="bg-card/20 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-orange-500" /> Recent Communications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                            {i === 0 ? <Phone className="h-4 w-4 text-blue-400" /> : <Mail className="h-4 w-4 text-orange-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="font-medium text-white text-sm">Follow-up Call regarding Investment Plan</p>
                                                <span className="text-xs text-muted-foreground">2d ago</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Discussed the new volatility in tech sector and potential diversification strategies...</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function CustomerSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-[250px] w-full rounded-3xl" />
            <div className="grid grid-cols-3 gap-6">
                <Skeleton className="col-span-2 h-[200px]" />
                <Skeleton className="h-[200px]" />
            </div>
        </div>
    )
}
