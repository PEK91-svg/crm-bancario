"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { CommunicationList } from "@/components/communications/communication-list"
import { CommunicationDetail } from "@/components/communications/communication-detail"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MessageSquare, Inbox } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommunicationsPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Fetch calls, emails, chats in parallel
    const { data: callsRes, isLoading: loadingCalls } = useQuery({
        queryKey: ['communications', 'calls'],
        queryFn: () => api.get('communications/calls').json<{ data: any[] }>()
    })

    const { data: emailsRes, isLoading: loadingEmails } = useQuery({
        queryKey: ['communications', 'emails'],
        queryFn: () => api.get('communications/emails').json<{ data: any[] }>()
    })

    const { data: chatsRes, isLoading: loadingChats } = useQuery({
        queryKey: ['communications', 'chats'],
        queryFn: () => api.get('communications/chats').json<{ data: any[] }>()
    })

    const calls = callsRes?.data || [];
    const emails = emailsRes?.data || [];
    const chats = chatsRes?.data || [];

    // Normalize data for list view (mock normalization - normally backend returns unified or we map here)
    const allCommunications = [
        ...(calls).map(c => ({ ...c, type: 'call' })),
        ...(emails).map(e => ({ ...e, type: 'email' })),
        ...(chats).map(c => ({ ...c, type: 'chat' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const isLoading = loadingCalls || loadingEmails || loadingChats

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Left Panel: List */}
            <div className="w-full md:w-[400px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Inbox</h1>
                </div>

                <Tabs defaultValue="all" className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="all"><Inbox className="h-4 w-4 mr-2" /> All</TabsTrigger>
                        <TabsTrigger value="calls"><Phone className="h-4 w-4 mr-2" /> Calls</TabsTrigger>
                        <TabsTrigger value="emails"><Mail className="h-4 w-4 mr-2" /> Mail</TabsTrigger>
                        <TabsTrigger value="chats"><MessageSquare className="h-4 w-4 mr-2" /> Chat</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 border rounded-xl border-white/5 bg-card/20">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-4 w-[150px]" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <TabsContent value="all" className="m-0 space-y-2">
                                <CommunicationList items={allCommunications} onSelect={setSelectedId} selectedId={selectedId} filter="all" />
                            </TabsContent>
                        )}
                        {!isLoading && (
                            <>
                                <TabsContent value="calls" className="m-0 space-y-2">
                                    <CommunicationList items={allCommunications} onSelect={setSelectedId} selectedId={selectedId} filter="call" />
                                </TabsContent>
                                <TabsContent value="emails" className="m-0 space-y-2">
                                    <CommunicationList items={allCommunications} onSelect={setSelectedId} selectedId={selectedId} filter="email" />
                                </TabsContent>
                                <TabsContent value="chats" className="m-0 space-y-2">
                                    <CommunicationList items={allCommunications} onSelect={setSelectedId} selectedId={selectedId} filter="chat" />
                                </TabsContent>
                            </>
                        )}

                    </div>
                </Tabs>
            </div>

            {/* Right Panel: Detail */}
            <div className="hidden md:flex flex-1 rounded-2xl border border-white/5 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                {selectedId ? (
                    <CommunicationDetail id={selectedId} item={allCommunications.find(c => c.id === selectedId)} />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Inbox className="h-16 w-16 mb-4 opacity-20" />
                        <p>Select a conversation to view details</p>
                    </div>
                )}
            </div>
        </div>
    )
}
