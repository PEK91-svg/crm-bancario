"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { DeleteButton } from "@/components/shared/DeleteButton"
import { useQueryClient } from "@tanstack/react-query"

export default function CasesPage() {
    const { data: casesResponse, isLoading } = useQuery({
        queryKey: ['cases'],
        queryFn: () => api.get('cases').json<{ data: any[] }>()
    })

    const cases = casesResponse?.data || [];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Support Cases</h1>
                    <p className="text-muted-foreground mt-1">Track and resolve customer issues</p>
                </div>
                <Link href="/cases/new">
                    <Button className="gap-2 bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/25">
                        <Plus className="h-4 w-4" /> New Case
                    </Button>
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search cases..." className="pl-9 bg-black/20 border-white/10 focus:border-purple-500/50" />
                </div>
            </div>

            {/* Cases Table */}
            <div className="rounded-xl border border-white/5 bg-card/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white">Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Created</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            cases.map((ticket: any) => (
                                <TableRow key={ticket.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-700 to-pink-800 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 transition-colors">
                                                <AlertCircle className="h-5 w-5 text-purple-200" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-purple-400 text-base hover:text-purple-300 transition-colors">
                                                    {ticket.subject}
                                                </div>
                                                <div className="text-sm text-purple-200/70 font-mono font-medium">
                                                    #CASE-{ticket.caseNumber || ticket.id.substring(0, 6)}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize bg-white/10 border-white/20 text-white font-medium">
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize font-medium ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-sm text-white font-medium">
                                        {ticket.channel}
                                    </TableCell>
                                    <TableCell className="text-purple-200/80 text-sm font-medium">
                                        {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <DeleteButton
                                                entityId={ticket.id}
                                                entityType="case"
                                                entityName={ticket.subject}
                                                onSuccess={() => {
                                                    // Start refetch
                                                    const queryClient = useQueryClient();
                                                    queryClient.invalidateQueries({ queryKey: ['cases'] });
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
