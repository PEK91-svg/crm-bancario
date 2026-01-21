"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { DeleteButton } from "@/components/shared/DeleteButton"
import { useQueryClient } from "@tanstack/react-query"

export default function AccountsPage() {
    const { data: accountsResponse, isLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => api.get('accounts').json<{ data: any[] }>()
    })

    const accounts = accountsResponse?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Accounts</h1>
                    <p className="text-muted-foreground mt-1">Manage corporate and retail accounts</p>
                </div>
                <Link href="/accounts/new">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/25">
                        <Plus className="h-4 w-4" /> New Account
                    </Button>
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search accounts..." className="pl-9 bg-black/20 border-white/10 focus:border-blue-500/50" />
                </div>
            </div>

            {/* Accounts Table */}
            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Segment</TableHead>
                            <TableHead>NDG</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                            accounts.map((account: any) => (
                                <TableRow key={account.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                                <Building2 className="h-5 w-5 text-blue-200" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-blue-400 text-base hover:text-blue-300 transition-colors">
                                                    {account.name}
                                                </div>
                                                <div className="text-sm text-blue-200/70 font-medium">{account.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium">
                                            {account.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-sm text-white font-medium">
                                        {account.segment?.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell className="text-blue-100 text-sm font-mono font-medium">
                                        {account.ndg || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <DeleteButton
                                                entityId={account.id}
                                                entityType="account"
                                                entityName={account.name}
                                                onSuccess={() => {
                                                    // Start refetch
                                                    const queryClient = useQueryClient();
                                                    queryClient.invalidateQueries({ queryKey: ['accounts'] });
                                                }}
                                            />
                                        </div>
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
