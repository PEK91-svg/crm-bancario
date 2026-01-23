/**
 * Marketing - Analytics Page
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp,
    Mail,
    MousePointer,
    DollarSign,
    Users,
    Target
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const performanceData = [
    { month: 'Jan', sent: 45000, opens: 12600, clicks: 1890, revenue: 18900 },
    { month: 'Feb', sent: 52000, opens: 14560, clicks: 2184, revenue: 21840 },
    { month: 'Mar', sent: 48000, opens: 13440, clicks: 2016, revenue: 20160 },
    { month: 'Apr', sent: 61000, opens: 17080, clicks: 2562, revenue: 25620 },
    { month: 'May', sent: 55000, opens: 15400, clicks: 2310, revenue: 23100 },
    { month: 'Jun', sent: 67000, opens: 18760, clicks: 2814, revenue: 28140 },
]

const channelData = [
    { name: 'Email', value: 65, color: '#00D9FF' },
    { name: 'SMS', value: 20, color: '#8B5CF6' },
    { name: 'Push', value: 15, color: '#10B981' },
]

const attributionData = [
    { touchpoint: 'First Touch', revenue: 45000 },
    { touchpoint: 'Last Touch', revenue: 38000 },
    { touchpoint: 'Linear', revenue: 32000 },
    { touchpoint: 'Time Decay', revenue: 35000 },
]

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    Marketing Analytics
                </h1>
                <p className="text-gray-400 mt-1">Campaign performance and ROI tracking</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-400"> font-medium">Total Campaigns</span>
                            <Target className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">42</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +8
                            </span>
                            <span className="text-xs text-gray-500">this month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-400 font-medium">Avg Open Rate</span>
                            <Mail className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">28.3%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-red-400 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 rotate-180" />
                                -1.2%
                            </span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-400 font-medium">Avg Click Rate</span>
                            <MousePointer className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">4.2%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +0.5%
                            </span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-400 font-medium">Total Revenue</span>
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">$147.8K</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-emerald-400 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +18%
                            </span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Over Time */}
            <Card className="bg-card/40 border-white/10">
                <CardHeader>
                    <CardTitle className="text-xl text-white">Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1A1A1A',
                                        border: '1px solid #2A2A2A',
                                        borderRadius: '8px',
                                        color: '#FFFFFF'
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="opens" stroke="#00D9FF" strokeWidth={2} name="Opens" />
                                <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2} name="Clicks" />
                                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue ($)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Channel Distribution */}
                <Card className="bg-card/40 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Distribution by Channel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={channelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {channelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            {channelData.map((channel) => (
                                <div key={channel.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }}></div>
                                    <span className="text-sm text-gray-400">{channel.name} ({channel.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Attribution Models */}
                <Card className="bg-card/40 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Attribution Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attributionData}>
                                    <XAxis dataKey="touchpoint" stroke="#64748B" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1A1A1A',
                                            border: '1px solid #2A2A2A',
                                            borderRadius: '8px',
                                            color: '#FFFFFF'
                                        }}
                                    />
                                    <Bar dataKey="revenue" fill="#00D9FF" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Leaderboard */}
            <Card className="bg-card/40 border-white/10">
                <CardHeader>
                    <CardTitle className="text-xl text-white">Top Performing Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { name: 'Summer Sale 2026', revenue: 42800, opens: 32, clicks: 5.1 },
                            { name: 'Product Launch', revenue: 38200, opens: 28, clicks: 4.8 },
                            { name: 'Welcome Series', revenue: 24500, opens: 35, clicks: 6.2 },
                        ].map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-white/5 hover:bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl font-bold text-cyan-400">#{i + 1}</div>
                                    <div>
                                        <div className="font-semibold text-white">{c.name}</div>
                                        <div className="text-sm text-gray-500">Marketing Campaign</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 text-sm">
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Revenue</div>
                                        <div className="text-emerald-400 font-bold">${c.revenue.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Opens</div>
                                        <div className="text-white font-semibold">{c.opens}%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Clicks</div>
                                        <div className="text-white font-semibold">{c.clicks}%</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
