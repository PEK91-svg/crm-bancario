"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
    Calculator,
    User,
    CreditCard,
    Settings,
    Smile,
    Mail,
    FileText,
    Search,
    LayoutDashboard,
    Megaphone
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { api } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"

export function CommandMenu() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const debouncedQuery = useDebounce(query, 300)

    // Toggle with Cmd+K
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    // Fetch search results
    const { data, isLoading } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) return { results: [] };
            return api.get(`search?q=${debouncedQuery}`).json<{ results: any[] }>();
        },
        enabled: debouncedQuery.length >= 2
    })

    // Group results by type
    const groups = React.useMemo(() => {
        if (!data?.results) return {};
        return data.results.reduce((acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item);
            return acc;
        }, {} as Record<string, any[]>);
    }, [data]);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Type a command or search..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                {/* Static Navigation Group */}
                {query.length === 0 && (
                    <CommandGroup heading="Suggestions">
                        <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/customers"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Customers</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/communications"))}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Communications</span>
                            <CommandShortcut>⌘C</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/journeys"))}>
                            <Megaphone className="mr-2 h-4 w-4" />
                            <span>Marketing</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/pratiche"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Pratiche</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                )}

                {/* Dynamic Search Results */}
                {groups.contact?.length > 0 && (
                    <CommandGroup heading="Contacts">
                        {groups.contact.map((contact: any) => (
                            <CommandItem key={contact.id} onSelect={() => runCommand(() => router.push(contact.url || `/customers/${contact.id}`))}>
                                <User className="mr-2 h-4 w-4" />
                                <span>{contact.title}</span>
                                <span className="ml-2 text-muted-foreground text-xs hidden sm:inline">{contact.subtitle}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {groups.account?.length > 0 && (
                    <CommandGroup heading="Accounts">
                        {groups.account.map((account: any) => (
                            <CommandItem key={account.id} onSelect={() => runCommand(() => router.push(account.url || `/accounts/${account.id}`))}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>{account.title}</span>
                                <span className="ml-auto text-muted-foreground text-xs">{account.subtitle}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {groups.case?.length > 0 && (
                    <CommandGroup heading="Cases">
                        {groups.case.map((kase: any) => (
                            <CommandItem key={kase.id} onSelect={() => runCommand(() => router.push(kase.url || `/cases/${kase.id}`))}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>{kase.title}</span>
                                <span className="ml-auto text-muted-foreground text-xs">{kase.subtitle}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

            </CommandList>
        </CommandDialog>
    )
}
