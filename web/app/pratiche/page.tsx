"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function PratichePage() {
    const { data: pratiche, isLoading } = useQuery({
        queryKey: ['pratiche'],
        queryFn: () => api.get('pratiche').json<any[]>()
    })

    const statusColors: any = {
        pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        approved: 'bg-green-500/10 text-green-500 border-green-500/20',
        rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Gestione Pratiche</h1>
                    <p className="text-muted-foreground mt-1">Onboarding e flussi operativi</p>
                </div>
                <Button className="gap-2 bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/25">
                    <Plus className="h-4 w-4" /> Nuova Pratica
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-[200px] rounded-2xl" />
                    ))
                ) : (
                    pratiche?.map((pratica: any) => (
                        <Card key={pratica.id} className="hover:border-purple-500/50 transition-colors cursor-pointer bg-card/40">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={statusColors[pratica.status] || ''}>
                                        {pratica.status?.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">#{pratica.praticaNumber}</span>
                                </div>
                                <CardTitle className="text-lg text-white">
                                    {pratica.type === 'apertura_conto' ? 'Apertura Conto' : pratica.type}
                                </CardTitle>
                                <CardDescription>
                                    {pratica.contact?.firstName} {pratica.contact?.lastName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Step Corrente</span>
                                            <span className="text-white font-medium">{pratica.currentStep || 'Inizializzazione'}</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 rounded-full w-[45%]" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Due {new Date(pratica.dueDate).toLocaleDateString()}
                                        </div>
                                        {pratica.slaBreached && (
                                            <span className="text-red-400 font-bold">SLA BREACHED</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
