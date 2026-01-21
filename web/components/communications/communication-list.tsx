import { cn } from "@/lib/utils"
import { Phone, Mail, MessageSquare, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"

interface CommunicationListProps {
    items: any[]
    onSelect: (id: string) => void
    selectedId: string | null
    filter: string
}

export function CommunicationList({ items, onSelect, selectedId, filter }: CommunicationListProps) {
    const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter)

    if (filteredItems.length === 0) {
        return <div className="p-8 text-center text-muted-foreground text-sm">No communications found</div>
    }

    return (
        <div className="space-y-2 pb-4">
            {filteredItems.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                        "group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                        selectedId === item.id
                            ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5"
                            : "bg-card/40 border-white/5 hover:bg-white/5 hover:border-white/10"
                    )}
                >
                    <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/5",
                        selectedId === item.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-white"
                    )}>
                        {item.type === 'call' && <Phone className="h-4 w-4" />}
                        {item.type === 'email' && <Mail className="h-4 w-4" />}
                        {item.type === 'chat' && <MessageSquare className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                            <span className={cn("font-bold truncate", selectedId === item.id ? "text-primary" : "text-blue-300")}>
                                {item.contact?.firstName || 'Unknown'} {item.contact?.lastName || 'Contact'}
                            </span>
                            <span className="text-xs text-gray-400 font-medium shrink-0 tabular-nums">
                                {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: it }) : 'Just now'}
                            </span>
                        </div>

                        <p className="text-xs text-blue-100/70 font-medium truncate flex items-center gap-1">
                            {item.direction === 'inbound' ? <ArrowDownLeft className="h-3 w-3 text-green-400" /> : <ArrowUpRight className="h-3 w-3 text-blue-400" />}
                            {item.status || item.subject || 'No details'}
                        </p>

                        {(item.notes || item.body || item.lastMessage) && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                                {item.notes || item.body || item.lastMessage}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
