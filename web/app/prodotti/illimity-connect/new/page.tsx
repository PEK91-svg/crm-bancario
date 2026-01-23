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
    productName: z.string().optional(),
    productCode: z.string().optional(),
    contractNumber: z.string().optional(),
    amount: z.string().optional(),
    interestRate: z.string().optional(),
    status: z.enum(["active", "pending", "suspended", "closed"]).default("pending"),
    expiresAt: z.string().optional(),
    notes: z.string().optional(),
})

export default function NewIllimityConnectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { status: "pending" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            await api.post("illimity-connect", { json: values }).json()
            toast.success("Prodotto illimity Connect creato con successo")
            router.push("/prodotti/illimity-connect")
        } catch (error) {
            toast.error("Errore nella creazione del prodotto")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Nuovo illimity Connect</h1>
                <p className="text-muted-foreground">Inserisci i dati del nuovo prodotto illimity Connect.</p>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="productName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Prodotto</FormLabel>
                                    <FormControl><Input placeholder="illimity Connect Base" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="productCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Codice Prodotto</FormLabel>
                                    <FormControl><Input placeholder="ILC-001" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="contractNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Numero Contratto</FormLabel>
                                <FormControl><Input placeholder="CTR-2024-00001" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Importo</FormLabel>
                                    <FormControl><Input placeholder="25000.00" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="interestRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tasso (%)</FormLabel>
                                    <FormControl><Input placeholder="4.5000" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="expiresAt" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Scadenza</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">In Attesa</SelectItem>
                                        <SelectItem value="active">Attivo</SelectItem>
                                        <SelectItem value="suspended">Sospeso</SelectItem>
                                        <SelectItem value="closed">Chiuso</SelectItem>
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
                            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-500">
                                {loading ? "Creazione..." : "Crea Prodotto"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Annulla</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
