/**
 * Marketing Dashboard - Main Control Room
 */

"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    TrendingUp,
    TrendingDown,
    Mail,
    MousePointer,
    DollarSign,
    Users,
    Zap,
    Target,
    BarChart3
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
    label: string
    value: string | number
    trend?: number
    icon: React.ReactNode
    target?: number
}

function MetricCard({ label, value, trend, icon, target }: MetricCardProps) {
    const trendPositive = trend && trend > 0

    return (
        <Card className="bg-card/40 border-white/10 hover:border-white/20 transition-all">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400 font-medium">{label}</span>
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        {icon}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
                    {trend !== undefined && (
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium flex items-center gap-1 ${trendPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(trend)}%
                            </span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    )}
                    {target && (
                        <div className="text-xs text-gray-500">Target: {target}%</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function MarketingDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['marketing-dashboard'],
        queryFn: () => api.get('marketing/dashboard').json<any>()
    })

    const { data: campaignsRes } = useQuery({
        queryKey: ['marketing-campaigns'],
        queryFn: () => api.get('marketing/campaigns?limit=5').json<{ data: any[] }>()
    })

    const campaigns = campaignsRes?.data || []

    // Mock performance data for chart
    const performanceData = [
        { day: 'Mon', opens: 28, clicks: 4.2 },
        { day: 'Tue', opens: 32, clicks: 5.1 },
        { day: 'Wed', opens: 29, clicks: 4.8 },
        { day: 'Thu', opens: 35, clicks: 5.5 },
        { day: 'Fri', opens: 31, clicks: 4.9 },
        { day: 'Sat', opens: 22, clicks: 3.2 },
        { day: 'Sun', opens: 25, clicks: 3.8 },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Marketing Control Room
                    </h1>
                    <p className="text-gray-400 mt-1">Last 30 days performance overview</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/marketing/campaigns/new">
                        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
                            <Zap className="h-4 w-4" />
                            New Campaign
                        </button>
                    </Link>
                    <Link href="/marketing/journeys/new">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
                            <Target className="h-4 w-4" />
                            New Journey
                        </button>
                    </Link>
                </div>
            </div>

            {/* Key Metrics */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-[140px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="Messages Sent"
                        value="125.4K"
                        trend={12}
                        icon={<Mail className="h-5 w-5" />}
                    />
                    <MetricCard
                        label="Open Rate"
                        value="28.3%"
                        trend={-2.1}
                        target={30}
                        icon={<BarChart3 className="h-5 w-5" />}
                    />
                    <MetricCard
                        label="Click Rate"
                        value="4.2%"
                        trend={5}
                        icon={<MousePointer className="h-5 w-5" />}
                    />
                    <MetricCard
                        label="Revenue"
                        value="$42.8K"
                        trend={18}
                        icon={<DollarSign className="h-5 w-5" />}
                    />
                </div>
            )}

            {/* Performance Chart */}
            <Card className="bg-card/40 border-white/10">
                <CardHeader>
                    <CardTitle className="text-xl text-white">Weekly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <XAxis
                                    dataKey="day"
                                    stroke="#64748B"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#64748B"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1A1A1A',
                                        border: '1px solid #2A2A2A',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="opens"
                                    stroke="#00D9FF"
                                    strokeWidth={2}
                                    dot={{ fill: '#00D9FF', r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    dot={{ fill: '#8B5CF6', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                            <span className="text-sm text-gray-400">Open Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-400">Click Rate</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Campaigns */}
            <Card className="bg-card/40 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl text-white">Recent Campaigns</CardTitle>
                    <Link href="/marketing/campaigns" className="text-sm text-cyan-400 hover:text-cyan-300">
                        View all →
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {campaigns.map((campaign: any) => (
                            <div
                                key={campaign.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-white">{campaign.name}</h3>
                                            <Badge variant="outline" className={
                                                campaign.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    campaign.status === 'scheduled' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }>
                                                {campaign.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {campaign.total_sent > 0 ? `${campaign.total_sent.toLocaleString()} sent` : 'Not launched yet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Opens</div>
                                        <div className="text-white font-semibold tabular-nums">
                                            {campaign.total_opened > 0 ?
                                                ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1) + '%'
                                                : '-'
                                            }
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Clicks</div>
                                        <div className="text-white font-semibold tabular-nums">
                                            {campaign.total_clicked > 0 ?
                                                ((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1) + '%'
                                                : '-'
                                            }
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Revenue</div>
                                        <div className="text-emerald-400 font-semibold tabular-nums">
                                            ${campaign.total_revenue?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {campaigns.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No campaigns yet. Create your first campaign to get started.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/marketing/segments">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-emerald-500/20">
                                    <Users className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Audience Segments</h3>
                                    <p className="text-sm text-gray-400">Manage target audiences</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/marketing/analytics">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-500/20">
                                    <BarChart3 className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Analytics & Attribution</h3>
                                    <p className="text-sm text-gray-400">Track ROI and performance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/marketing/journeys">
                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-500/20">
                                    <Target className="h-6 w-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Journey Builder</h3>
                                    <p className="text-sm text-gray-400">Visual automation flows</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
