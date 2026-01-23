"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as z from "zod"
import { useState } from "react"

const formSchema = z.object({
    name: z.string().optional(),
    lineNumber: z.string().optional(),
    type: z.string().optional(),
    grantedAmount: z.string().min(1, "Importo accordato richiesto"),
    interestRate: z.string().optional(),
    status: z.enum(["active", "suspended", "revoked", "closed"]).default("active"),
    grantedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    notes: z.string().optional(),
})

export default function NewLineaLiberaPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { status: "active" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            await api.post("linee-libere", { json: values }).json()
            toast.success("Linea libera creata con successo")
            router.push("/prodotti/linee-libere")
        } catch (error) {
            toast.error("Errore nella creazione della linea")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Nuova Linea Libera</h1>
                <p className="text-muted-foreground">Inserisci i dati della nuova linea di credito.</p>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Linea</FormLabel>
                                <FormControl><Input placeholder="Fido Conto Corrente" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="lineNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Numero Linea</FormLabel>
                                    <FormControl><Input placeholder="LIN-2024-001" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipologia</FormLabel>
                                    <FormControl><Input placeholder="fido, anticipo_fatture..." {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="grantedAmount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Importo Accordato</FormLabel>
                                    <FormControl><Input placeholder="50000.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="interestRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tasso Interesse (%)</FormLabel>
                                    <FormControl><Input placeholder="5.5000" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="grantedAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data Concessione</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiresAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data Scadenza</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Attiva</SelectItem>
                                        <SelectItem value="suspended">Sospesa</SelectItem>
                                        <SelectItem value="revoked">Revocata</SelectItem>
                                        <SelectItem value="closed">Chiusa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Note</FormLabel>
                                <FormControl><Textarea placeholder="Note aggiuntive..." {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-500">
                                {loading ? "Creazione..." : "Crea Linea"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Annulla</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
