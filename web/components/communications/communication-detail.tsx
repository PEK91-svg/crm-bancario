import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MessageSquare, Calendar, Clock, User, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function CommunicationDetail({ id, item }: { id: string, item: any }) {
    if (!item) return null

    return (
        <div className="flex flex-col h-full w-full bg-card/10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10 shadow-inner">
                        <User className="h-6 w-6 text-gray-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{item.contact?.firstName} {item.contact?.lastName}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {item.type === 'call' && <Phone className="h-3 w-3" />}
                            {item.type === 'email' && <Mail className="h-3 w-3" />}
                            {item.type === 'chat' && <MessageSquare className="h-3 w-3" />}
                            <span>•</span>
                            <span>{item.createdAt ? format(new Date(item.createdAt), "d MMM yyyy, HH:mm", { locale: it }) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={item.direction === 'inbound' ? 'secondary' : 'default'} className="uppercase">
                        {item.direction}
                    </Badge>
                    {item.status && <Badge variant="outline">{item.status}</Badge>}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8">

                {/* Call Specific UI */}
                {item.type === 'call' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-white">Call Recording</h3>
                                <span className="text-xs font-mono text-muted-foreground">{item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
                            </div>
                            {/* Fake Waveform */}
                            <div className="flex items-center gap-1 h-12 w-full justify-center opacity-50">
                                {Array(40).fill(0).map((_, i) => (
                                    <div key={i} className="w-1 bg-cyan-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }} />
                                ))}
                            </div>
                            <div className="flex justify-center">
                                <Button size="sm" variant="secondary" className="rounded-full px-6">Play Recording</Button>
                            </div>
                        </div>

                        {item.notes && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notes</h3>
                                <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                                    {item.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Email Specific UI */}
                {item.type === 'email' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="space-y-2 border-b border-white/5 pb-6">
                            <h1 className="text-2xl font-bold text-white">{item.subject}</h1>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>To: me, Systems</span>
                            </div>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <p>{item.body}</p>
                        </div>
                    </div>
                )}

                {/* Chat Specific UI */}
                {item.type === 'chat' && (
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="flex justify-center">
                            <Badge variant="outline" className="bg-black/40 border-white/5 text-xs">Chat started on {item.startedAt}</Badge>
                        </div>

                        {/* Mock chat bubbles if no messages provided in initial list */}
                        {!item.messages?.length && (
                            <div className="text-center py-10 text-muted-foreground">
                                No messages loaded (Detail fetch not implemented yet)
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-2">
                <Button variant="ghost">Archive</Button>
                <Button variant="default">Reply</Button>
            </div>
        </div>
    )
}
