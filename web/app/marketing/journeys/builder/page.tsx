/**
 * Marketing - Journey Builder Page
 * Visual flow editor for marketing automation
 */

"use client"

import { useState, useCallback } from 'react'
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Background,
    Controls,
    MiniMap,
    Connection,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Mail,
    Clock,
    GitBranch,
    Zap,
    Play,
    Save,
    Undo,
    Settings,
    Users
} from "lucide-react"

// Node types for journey
const nodeTypes = {
    trigger: TriggerNode,
    wait: WaitNode,
    action: ActionNode,
    condition: ConditionNode
}

// Custom Node Components
function TriggerNode({ data }: any) {
    return (
        <div className="px-4 py-3 rounded-lg border-2 border-purple-500 bg-purple-500/10 backdrop-blur min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-white text-sm">Trigger</span>
            </div>
            <div className="text-xs text-purple-200">{data.label}</div>
        </div>
    )
}

function WaitNode({ data }: any) {
    return (
        <div className="px-4 py-3 rounded-lg border-2 border-blue-500 bg-blue-500/10 backdrop-blur min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-white text-sm">Wait</span>
            </div>
            <div className="text-xs text-blue-200">{data.label}</div>
        </div>
    )
}

function ActionNode({ data }: any) {
    return (
        <div className="px-4 py-3 rounded-lg border-2 border-emerald-500 bg-emerald-500/10 backdrop-blur min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-white text-sm">Send Email</span>
            </div>
            <div className="text-xs text-emerald-200">{data.label}</div>
            <div className="mt-2 flex gap-1">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Opens: 28%</span>
            </div>
        </div>
    )
}

function ConditionNode({ data }: any) {
    return (
        <div className="px-4 py-3 rounded-lg border-2 border-amber-500 bg-amber-500/10 backdrop-blur min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-white text-sm">Condition</span>
            </div>
            <div className="text-xs text-amber-200">{data.label}</div>
        </div>
    )
}

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { label: 'Contact Created' }
    },
    {
        id: '2',
        type: 'wait',
        position: { x: 250, y: 150 },
        data: { label: 'Wait 24 hours' }
    },
    {
        id: '3',
        type: 'action',
        position: { x: 250, y: 250 },
        data: { label: 'Welcome Email' }
    },
    {
        id: '4',
        type: 'condition',
        position: { x: 250, y: 370 },
        data: { label: 'Opened email?' }
    },
    {
        id: '5',
        type: 'action',
        position: { x: 100, y: 490 },
        data: { label: 'Follow-up Email' }
    },
    {
        id: '6',
        type: 'action',
        position: { x: 400, y: 490 },
        data: { label: 'Reminder Email' }
    }
]

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-3', source: '2', target: '3', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e3-4', source: '3', target: '4', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    {
        id: 'e4-5',
        source: '4',
        target: '5',
        label: 'Yes',
        animated: true,
        style: { stroke: '#10B981' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
    },
    {
        id: 'e4-6',
        source: '4',
        target: '6',
        label: 'No',
        animated: true,
        style: { stroke: '#F59E0B' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' }
    }
]

export default function JourneyBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/10 bg-black/40 backdrop-blur px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">Welcome Sequence</h1>
                    <span className="text-sm text-gray-400">v2 (Active)</span>
                    <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-400 border border-green-500/20">
                        1,245 active users
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Play className="h-4 w-4" />
                        Simulate
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Undo className="h-4 w-4" />
                        Version History
                    </Button>
                    <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                        <Save className="h-4 w-4" />
                        Save Journey
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar - Node Palette */}
                <div className="w-64 border-r border-white/10 bg-card/30 backdrop-blur p-4 space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">TRIGGERS</h3>
                        <div className="space-y-2">
                            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/10 cursor-move hover:border-purple-500/40 transition-all">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-400" />
                                    <span className="text-sm text-white font-medium">Event Trigger</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/10 cursor-move hover:border-purple-500/40 transition-all">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-400" />
                                    <span className="text-sm text-white font-medium">Segment Entry</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">ACTIONS</h3>
                        <div className="space-y-2">
                            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 cursor-move hover:border-emerald-500/40 transition-all">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm text-white font-medium">Send Email</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 cursor-move hover:border-emerald-500/40 transition-all">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm text-white font-medium">Update Field</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">LOGIC</h3>
                        <div className="space-y-2">
                            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/10 cursor-move hover:border-blue-500/40 transition-all">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm text-white font-medium">Wait</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 cursor-move hover:border-amber-500/40 transition-all">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-amber-400" />
                                    <span className="text-sm text-white font-medium">If/Else</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <Card className="p-4 bg-white/5 border-white/10 mt-6">
                        <h4 className="text-xs font-semibold text-gray-400 mb-3">JOURNEY STATS</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Entered:</span>
                                <span className="text-white font-semibold">1,245</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Active:</span>
                                <span className="text-cyan-400 font-semibold">892</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Completed:</span>
                                <span className="text-emerald-400 font-semibold">315</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Exited:</span>
                                <span className="text-red-400 font-semibold">38</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-[#0A0A0A]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-[#0A0A0A]"
                    >
                        <Background color="#2A2A2A" gap={16} />
                        <Controls className="bg-card/80 backdrop-blur border-white/10" />
                        <MiniMap
                            className="bg-card/80 backdrop-blur border border-white/10"
                            maskColor="rgba(0,0,0,0.6)"
                        />
                    </ReactFlow>
                </div>

                {/* Properties Panel (if node selected) */}
                {selectedNode && (
                    <div className="w-80 border-l border-white/10 bg-card/30 backdrop-blur p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Node Properties</h3>
                        {/* Node configuration form would go here */}
                    </div>
                )}
            </div>
        </div>
    )
}
