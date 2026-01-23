"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, PiggyBank } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useState } from "react"

export default function ContiDepositoPage() {
    const [search, setSearch] = useState("")

    const { data: response, isLoading } = useQuery({
        queryKey: ['conti-deposito', search],
        queryFn: () => api.get('conti-correnti', { searchParams: { type: 'conto_deposito', ...(search ? { search } : {}) } }).json<{ data: any[] }>()
    })

    const conti = response?.data || []

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dormant: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        blocked: "bg-red-500/10 text-red-400 border-red-500/20",
        closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">Conti Deposito</h1>
                    <p className="text-muted-foreground mt-1">Gestione conti deposito e risparmio</p>
                </div>
                <Link href="/prodotti/conti-deposito/new">
                    <Button className="gap-2 bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-500/25">
                        <Plus className="h-4 w-4" /> Nuovo Deposito
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per IBAN, nome..."
                        className="pl-9 bg-black/20 border-white/10 focus:border-violet-500/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Deposito</TableHead>
                            <TableHead>IBAN</TableHead>
                            <TableHead>Saldo</TableHead>
                            <TableHead>Tasso</TableHead>
                            <TableHead>Stato</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-white/5">
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : conti.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    Nessun conto deposito trovato
                                </TableCell>
                            </TableRow>
                        ) : (
                            conti.map((conto: any) => (
                                <TableRow key={conto.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-700 to-purple-800 flex items-center justify-center border border-white/10">
                                                <PiggyBank className="h-4 w-4 text-violet-200" />
                                            </div>
                                            <div className="font-medium text-white">{conto.name || 'Conto Deposito'}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-violet-100">{conto.iban}</TableCell>
                                    <TableCell className="font-mono text-sm text-white">
                                        {conto.balance ? `€ ${Number(conto.balance).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-white">
                                        {conto.interestRate ? `${conto.interestRate}%` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${statusColors[conto.status] || ''}`}>
                                            {conto.status}
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
