"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { FileUp, RefreshCw, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ModificheMassivePage() {
    const [entityType, setEntityType] = useState("")
    const [action, setAction] = useState("")
    const [processing, setProcessing] = useState(false)

    function handleExecute() {
        if (!entityType || !action) {
            toast.error("Seleziona entità e azione")
            return
        }
        setProcessing(true)
        setTimeout(() => {
            setProcessing(false)
            toast.success("Operazione completata con successo")
        }, 2000)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">Modifiche Massive</h1>
                <p className="text-muted-foreground mt-1">Esegui operazioni in blocco sui prodotti bancari</p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-amber-200 font-medium">Attenzione</p>
                    <p className="text-sm text-amber-200/70">Le modifiche massive sono irreversibili. Verifica attentamente i parametri prima di procedere.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <div className="rounded-xl border border-white/5 bg-card/20 p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-white">Configurazione</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Tipo Entità</label>
                            <Select onValueChange={setEntityType}>
                                <SelectTrigger className="bg-black/20 border-white/10">
                                    <SelectValue placeholder="Seleziona tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="conti-correnti">Conti Correnti</SelectItem>
                                    <SelectItem value="conti-deposito">Conti Deposito</SelectItem>
                                    <SelectItem value="carte-credito">Carte di Credito</SelectItem>
                                    <SelectItem value="carte-debito">Carte di Debito</SelectItem>
                                    <SelectItem value="carte-prepagate">Carte Prepagate</SelectItem>
                                    <SelectItem value="american-express">American Express</SelectItem>
                                    <SelectItem value="linee-libere">Linee Libere</SelectItem>
                                    <SelectItem value="illimity-connect">illimity Connect</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Azione</label>
                            <Select onValueChange={setAction}>
                                <SelectTrigger className="bg-black/20 border-white/10">
                                    <SelectValue placeholder="Seleziona azione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="update-status">Aggiorna Stato</SelectItem>
                                    <SelectItem value="update-limits">Aggiorna Limiti</SelectItem>
                                    <SelectItem value="block">Blocco Massivo</SelectItem>
                                    <SelectItem value="activate">Attivazione Massiva</SelectItem>
                                    <SelectItem value="close">Chiusura Massiva</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Filtro ID (opzionale)</label>
                            <Textarea
                                placeholder="Inserisci gli ID separati da virgola o uno per riga..."
                                className="bg-black/20 border-white/10 min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Import Panel */}
                <div className="rounded-xl border border-white/5 bg-card/20 p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-white">Import CSV</h2>

                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center space-y-4 hover:border-white/20 transition-colors">
                        <FileUp className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                            <p className="text-sm text-white font-medium">Trascina un file CSV o clicca per selezionare</p>
                            <p className="text-xs text-muted-foreground mt-1">Formato: ID, campo, nuovo_valore</p>
                        </div>
                        <Input type="file" accept=".csv" className="max-w-xs mx-auto bg-black/20 border-white/10" />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-sm font-medium text-white mb-2">Template</h3>
                        <p className="text-xs text-muted-foreground mb-3">Scarica un template CSV per il tipo di entità selezionato.</p>
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileUp className="h-3 w-3" /> Scarica Template
                        </Button>
                    </div>
                </div>
            </div>

            {/* Execute Button */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleExecute}
                    disabled={processing || !entityType || !action}
                    className="gap-2 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 px-8"
                >
                    {processing ? (
                        <>
                            <RefreshCw className="h-4 w-4 animate-spin" /> Elaborazione...
                        </>
                    ) : (
                        "Esegui Modifiche"
                    )}
                </Button>
            </div>
        </div>
    )
}
