"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { JourneyCard } from "@/components/marketing/journey-card"
import { Button } from "@/components/ui/button"
import { Plus, Rocket } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function JourneysPage() {
    const { data: journeys, isLoading } = useQuery({
        queryKey: ['journeys'],
        queryFn: () => api.get('journeys').json<any[]>()
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Marketing Journeys</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor your automated customer campaigns</p>
                </div>
                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/25">
                    <Plus className="h-4 w-4" /> New Journey
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><Rocket className="h-5 w-5" /></div>
                        <span className="text-sm font-medium text-muted-foreground">Active Campaigns</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {isLoading ? <Skeleton className="h-8 w-16" /> : journeys?.filter((j: any) => j.status === 'active').length || 0}
                    </div>
                </div>
                {/* ... more stats */}
            </div>

            {/* Journeys Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-[200px] rounded-2xl bg-card/20 border border-white/5 animate-pulse" />
                    ))
                ) : (
                    journeys?.map((journey: any) => (
                        <JourneyCard key={journey.id} journey={journey} />
                    ))
                )}
            </div>

            {!isLoading && journeys?.length === 0 && (
                <div className="text-center py-20 bg-card/10 rounded-3xl border border-dashed border-white/10">
                    <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white">No journeys found</h3>
                    <p className="text-muted-foreground">Get started by creating your first automation campaign.</p>
                </div>
            )}
        </div>
    )
}
