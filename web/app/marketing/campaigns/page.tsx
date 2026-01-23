/**
 * Marketing - Campaigns List Page
 */

"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Mail,
    Plus,
    Search,
    MoreHorizontal,
    Play,
    Pause,
    Trash2,
    BarChart3,
    Copy
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CampaignsPage() {
    const { data: campaignsRes, isLoading } = useQuery({
        queryKey: ['marketing-campaigns'],
        queryFn: () => api.get('marketing/campaigns').json<{ data: any[] }>()
    })

    const campaigns = campaignsRes?.data || []

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'scheduled':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            case 'paused':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'completed':
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            default:
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Campaigns</h1>
                    <p className="text-gray-400 mt-1">Manage your marketing campaigns</p>
                </div>
                <Link href="/marketing/campaigns/new">
                    <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                        <Plus className="h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="bg-card/40 border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search campaigns..."
                                className="pl-10 bg-white/5 border-white/10"
                            />
                        </div>
                        <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Scheduled</option>
                            <option>Paused</option>
                            <option>Completed</option>
                        </select>
                        <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                            <option>All Types</option>
                            <option>Broadcast</option>
                            <option>Journey</option>
                            <option>Recurring</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Campaigns Table */}
            <Card className="bg-card/40 border-white/10">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Campaign</th>
                                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                                    <th className="text-right p-4 text-sm font-semibold text-gray-400">Sent</th>
                                    <th className="text-right p-4 text-sm font-semibold text-gray-400">Open Rate</th>
                                    <th className="text-right p-4 text-sm font-semibold text-gray-400">Click Rate</th>
                                    <th className="text-right p-4 text-sm font-semibold text-gray-400">Revenue</th>
                                    <th className="text-right p-4 text-sm font-semibold text-gray-400"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="p-4" colSpan={7}>
                                                <Skeleton className="h-12 w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500">
                                            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No campaigns yet. Create your first campaign to get started.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((campaign: any) => (
                                        <tr
                                            key={campaign.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                                        <Mail className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{campaign.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{campaign.type}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={getStatusColor(campaign.status)}>
                                                    {campaign.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right text-white font-semibold tabular-nums">
                                                {campaign.total_sent?.toLocaleString() || '-'}
                                            </td>
                                            <td className="p-4 text-right text-white font-semibold tabular-nums">
                                                {campaign.total_sent > 0
                                                    ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1) + '%'
                                                    : '-'}
                                            </td>
                                            <td className="p-4 text-right text-white font-semibold tabular-nums">
                                                {campaign.total_sent > 0
                                                    ? ((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1) + '%'
                                                    : '-'}
                                            </td>
                                            <td className="p-4 text-right text-emerald-400 font-semibold tabular-nums">
                                                ${campaign.total_revenue?.toLocaleString() || '0'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-white/10">
                                                        <DropdownMenuItem className="gap-2">
                                                            <BarChart3 className="h-4 w-4" />
                                                            View Analytics
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2">
                                                            <Copy className="h-4 w-4" />
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        {campaign.status === 'active' && (
                                                            <DropdownMenuItem className="gap-2">
                                                                <Pause className="h-4 w-4" />
                                                                Pause
                                                            </DropdownMenuItem>
                                                        )}
                                                        {campaign.status === 'paused' && (
                                                            <DropdownMenuItem className="gap-2">
                                                                <Play className="h-4 w-4" />
                                                                Resume
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="gap-2 text-red-400">
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
