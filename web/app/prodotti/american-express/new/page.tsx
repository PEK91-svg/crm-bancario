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
    cardholderName: z.string().min(1, "Nome titolare richiesto"),
    lastFourDigits: z.string().length(4, "Inserire ultime 4 cifre").optional(),
    creditLimit: z.string().optional(),
    monthlyLimit: z.string().optional(),
    productName: z.string().optional(),
    expiresAt: z.string().optional(),
    status: z.enum(["active", "blocked", "expired", "cancelled", "pending_activation"]).default("pending_activation"),
})

export default function NewAmericanExpressPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { status: "pending_activation" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            await api.post("cards", { json: { ...values, type: "american_express", circuit: "american_express" } }).json()
            toast.success("Carta American Express creata con successo")
            router.push("/prodotti/american-express")
        } catch (error) {
            toast.error("Errore nella creazione della carta")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Nuova American Express</h1>
                <p className="text-muted-foreground">Inserisci i dati della nuova carta American Express.</p>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="cardholderName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Titolare</FormLabel>
                                <FormControl><Input placeholder="Mario Rossi" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="lastFourDigits" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ultime 4 Cifre</FormLabel>
                                    <FormControl><Input placeholder="3456" maxLength={4} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="productName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prodotto</FormLabel>
                                    <FormControl><Input placeholder="Gold, Platinum, Centurion..." {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="creditLimit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plafond</FormLabel>
                                    <FormControl><Input placeholder="15000.00" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="monthlyLimit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Limite Mensile</FormLabel>
                                    <FormControl><Input placeholder="10000.00" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="expiresAt" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Scadenza</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending_activation">In Attivazione</SelectItem>
                                        <SelectItem value="active">Attiva</SelectItem>
                                        <SelectItem value="blocked">Bloccata</SelectItem>
                                        <SelectItem value="expired">Scaduta</SelectItem>
                                        <SelectItem value="cancelled">Cancellata</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
                                {loading ? "Creazione..." : "Crea Carta"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Annulla</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
