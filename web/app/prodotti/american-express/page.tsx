"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useState } from "react"

export default function AmericanExpressPage() {
    const [search, setSearch] = useState("")

    const { data: response, isLoading } = useQuery({
        queryKey: ['cards-amex', search],
        queryFn: () => api.get('cards', { searchParams: { type: 'american_express', ...(search ? { search } : {}) } }).json<{ data: any[] }>()
    })

    const cards = response?.data || []

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        blocked: "bg-red-500/10 text-red-400 border-red-500/20",
        expired: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        pending_activation: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">American Express</h1>
                    <p className="text-muted-foreground mt-1">Gestione carte American Express</p>
                </div>
                <Link href="/prodotti/american-express/new">
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/25">
                        <Plus className="h-4 w-4" /> Nuova Amex
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per titolare, ultime cifre..."
                        className="pl-9 bg-black/20 border-white/10 focus:border-indigo-500/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Carta</TableHead>
                            <TableHead>Prodotto</TableHead>
                            <TableHead>Plafond</TableHead>
                            <TableHead>Disponibile</TableHead>
                            <TableHead>Scadenza</TableHead>
                            <TableHead>Stato</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-white/5">
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : cards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    Nessuna carta American Express trovata
                                </TableCell>
                            </TableRow>
                        ) : (
                            cards.map((card: any) => (
                                <TableRow key={card.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-700 to-indigo-800 flex items-center justify-center border border-white/10">
                                                <CreditCard className="h-4 w-4 text-sky-200" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{card.cardholderName || 'N/D'}</div>
                                                <div className="text-xs text-muted-foreground">**** {card.lastFourDigits || '****'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-white">{card.productName || '-'}</TableCell>
                                    <TableCell className="font-mono text-sm text-white">
                                        {card.creditLimit ? `€ ${Number(card.creditLimit).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-emerald-300">
                                        {card.availableCredit ? `€ ${Number(card.availableCredit).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{card.expiresAt || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize text-xs ${statusColors[card.status] || ''}`}>
                                            {card.status?.replace('_', ' ')}
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
