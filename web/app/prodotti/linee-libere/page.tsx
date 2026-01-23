"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useState } from "react"

export default function LineeeLiberePage() {
    const [search, setSearch] = useState("")

    const { data: response, isLoading } = useQuery({
        queryKey: ['linee-libere', search],
        queryFn: () => api.get('linee-libere', { searchParams: search ? { search } : {} }).json<{ data: any[] }>()
    })

    const linee = response?.data || []

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        suspended: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        revoked: "bg-red-500/10 text-red-400 border-red-500/20",
        closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">Linee Libere</h1>
                    <p className="text-muted-foreground mt-1">Gestione fidi e linee di credito</p>
                </div>
                <Link href="/prodotti/linee-libere/new">
                    <Button className="gap-2 bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-lg shadow-teal-500/25">
                        <Plus className="h-4 w-4" /> Nuova Linea
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per nome, numero linea..."
                        className="pl-9 bg-black/20 border-white/10 focus:border-teal-500/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Linea</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Accordato</TableHead>
                            <TableHead>Utilizzato</TableHead>
                            <TableHead>Disponibile</TableHead>
                            <TableHead>Stato</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-white/5">
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : linee.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    Nessuna linea libera trovata
                                </TableCell>
                            </TableRow>
                        ) : (
                            linee.map((linea: any) => (
                                <TableRow key={linea.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-700 to-cyan-800 flex items-center justify-center border border-white/10">
                                                <TrendingUp className="h-4 w-4 text-teal-200" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{linea.name || 'Linea di Credito'}</div>
                                                {linea.lineNumber && <div className="text-xs text-muted-foreground">{linea.lineNumber}</div>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-white capitalize">{linea.type || '-'}</TableCell>
                                    <TableCell className="font-mono text-sm text-white">
                                        {linea.grantedAmount ? `€ ${Number(linea.grantedAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-orange-300">
                                        {linea.usedAmount ? `€ ${Number(linea.usedAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '€ 0,00'}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-emerald-300">
                                        {linea.availableAmount ? `€ ${Number(linea.availableAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${statusColors[linea.status] || ''}`}>
                                            {linea.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
