"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function CustomersPage() {
    const { data: contacts, isLoading } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => api.get('contacts').json<any[]>()
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Clienti</h1>
                    <p className="text-muted-foreground mt-1">Gestione portafoglio clienti e prospect</p>
                </div>
                <Link href="/customers/new">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/25">
                        <Plus className="h-4 w-4" /> Nuovo Cliente
                    </Button>
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cerca cliente..." className="pl-9 bg-black/20 border-white/10 focus:border-emerald-500/50" />
                </div>
                {/* Add more filters here if needed */}
            </div>

            {/* Customers Table */}
            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Cliente</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Contatti</TableHead>
                            <TableHead>Ultima Attività</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-white/5">
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            contacts?.map((contact: any) => (
                                <TableRow key={contact.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                                                <span className="font-bold text-sm text-gray-300 group-hover:text-emerald-400">
                                                    {contact.firstName[0]}{contact.lastName[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                                                    <Link href={`/customers/${contact.id}`} className="hover:underline">
                                                        {contact.firstName} {contact.lastName}
                                                    </Link>
                                                </div>
                                                <div className="text-xs text-muted-foreground">{contact.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                            Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {contact.phone || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        2 ore fa
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
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
