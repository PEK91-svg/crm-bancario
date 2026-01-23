"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useState } from "react"

export default function IllimityConnectPage() {
    const [search, setSearch] = useState("")

    const { data: response, isLoading } = useQuery({
        queryKey: ['illimity-connect', search],
        queryFn: () => api.get('illimity-connect', { searchParams: search ? { search } : {} }).json<{ data: any[] }>()
    })

    const products = response?.data || []

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">illimity Connect</h1>
                    <p className="text-muted-foreground mt-1">Gestione prodotti illimity Connect</p>
                </div>
                <Link href="/prodotti/illimity-connect/new">
                    <Button className="gap-2 bg-amber-600 hover:bg-amber-500 text-white border-0 shadow-lg shadow-amber-500/25">
                        <Plus className="h-4 w-4" /> Nuovo Prodotto
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per prodotto, contratto..."
                        className="pl-9 bg-black/20 border-white/10 focus:border-amber-500/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Prodotto</TableHead>
                            <TableHead>Contratto</TableHead>
                            <TableHead>Importo</TableHead>
                            <TableHead>Tasso</TableHead>
                            <TableHead>Scadenza</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    Nessun prodotto illimity Connect trovato
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product: any) => (
                                <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-700 to-yellow-800 flex items-center justify-center border border-white/10">
                                                <Zap className="h-4 w-4 text-amber-200" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{product.productName || 'illimity Connect'}</div>
                                                {product.productCode && <div className="text-xs text-muted-foreground">{product.productCode}</div>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-white font-mono">{product.contractNumber || '-'}</TableCell>
                                    <TableCell className="font-mono text-sm text-white">
                                        {product.amount ? `€ ${Number(product.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-white">
                                        {product.interestRate ? `${product.interestRate}%` : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{product.expiresAt || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${statusColors[product.status] || ''}`}>
                                            {product.status}
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
