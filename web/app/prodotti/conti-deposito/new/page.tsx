"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as z from "zod"
import { useState } from "react"

const formSchema = z.object({
    iban: z.string().min(15, "IBAN richiesto").max(34),
    name: z.string().optional(),
    accountNumber: z.string().optional(),
    currency: z.string().default("EUR"),
    status: z.enum(["active", "dormant", "blocked", "closed"]).default("active"),
    productName: z.string().optional(),
    productCode: z.string().optional(),
    balance: z.string().optional(),
    interestRate: z.string().optional(),
})

export default function NewContoDepositoPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { currency: "EUR", status: "active" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            await api.post("conti-correnti", { json: { ...values, type: "conto_deposito" } }).json()
            toast.success("Conto deposito creato con successo")
            router.push("/prodotti/conti-deposito")
        } catch (error) {
            toast.error("Errore nella creazione del conto deposito")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Nuovo Conto Deposito</h1>
                <p className="text-muted-foreground">Inserisci i dati del nuovo conto deposito.</p>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="iban" render={({ field }) => (
                            <FormItem>
                                <FormLabel>IBAN</FormLabel>
                                <FormControl><Input placeholder="IT60X0542811101000000123456" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Deposito</FormLabel>
                                <FormControl><Input placeholder="Deposito Risparmio" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="productName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Prodotto</FormLabel>
                                    <FormControl><Input placeholder="Deposito Vincolato" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="interestRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tasso Interesse (%)</FormLabel>
                                    <FormControl><Input placeholder="3.5000" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="balance" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Importo Depositato</FormLabel>
                                <FormControl><Input placeholder="10000.00" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Attivo</SelectItem>
                                        <SelectItem value="dormant">Dormiente</SelectItem>
                                        <SelectItem value="blocked">Bloccato</SelectItem>
                                        <SelectItem value="closed">Chiuso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-500">
                                {loading ? "Creazione..." : "Crea Deposito"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Annulla</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
