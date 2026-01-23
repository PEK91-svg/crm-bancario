/**
 * Marketing - Segments (Audience Explorer) Page
 */

"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Users,
    Plus,
    Search,
    RefreshCw,
    TrendingUp,
    Filter
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function SegmentsPage() {
    const { data: segmentsRes, isLoading } = useQuery({
        queryKey: ['marketing-segments'],
        queryFn: () => api.get('marketing/segments').json<{ data: any[] }>()
    })

    const segments = segmentsRes?.data || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Audience Segments</h1>
                    <p className="text-gray-400 mt-1">Target the right people with precision</p>
                </div>
                <Link href="/marketing/segments/new">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500">
                        <Plus className="h-4 w-4" />
                        New Segment
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card className="bg-card/40 border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search segments..."
                                className="pl-10 bg-white/5 border-white/10"
                            />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Segments Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-[220px] rounded-xl" />
                    ))}
                </div>
            ) : segments.length === 0 ? (
                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-12 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No segments yet. Create your first segment to target specific audiences.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map((segment: any) => (
                        <Card
                            key={segment.id}
                            className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-white mb-2">{segment.name}</CardTitle>
                                        <p className="text-sm text-gray-400 line-clamp-2">{segment.description || 'No description'}</p>
                                    </div>
                                    <Badge variant="outline" className={segment.is_dynamic ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}>
                                        {segment.is_dynamic ? 'Dynamic' : 'Static'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Member count */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/20">
                                            <Users className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white tabular-nums">
                                                {segment.member_count?.toLocaleString() || '0'}
                                            </div>
                                            <div className="text-xs text-gray-500">Members</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 group-hover:bg-white/10"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Last calculated */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Last updated:</span>
                                    <span>{segment.last_calculated_at ? new Date(segment.last_calculated_at).toLocaleDateString() : 'Never'}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 text-xs">
                                        View Members
                                    </Button>
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs">
                                        Use in Campaign
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-cyan-500/10">
                                <TrendingUp className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{segments.length}</div>
                                <div className="text-sm text-gray-500">Total Segments</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10">
                                <Users className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {segments.reduce((sum: number, s: any) => sum + (s.member_count || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">Total Contacts</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-500/10">
                                <RefreshCw className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {segments.filter((s: any) => s.is_dynamic).length}
                                </div>
                                <div className="text-sm text-gray-500">Dynamic Segments</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
