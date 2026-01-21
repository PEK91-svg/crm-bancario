"use client"

import { Button } from "@/components/ui/button"
import { Target, Plus, TrendingUp, PiggyBank } from "lucide-react"
import { Construction } from "lucide-react"

export default function ProjectsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <Target className="h-32 w-32 text-blue-400 relative z-10" />
            </div>

            <div className="space-y-2 max-w-lg">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    Progetti di Spesa
                </h1>
                <p className="text-xl text-gray-300">
                    Pianifica i tuoi obiettivi finanziari e monitora i progressi.
                </p>
                <p className="text-gray-400 text-sm">
                    Questa funzionalità è in fase di sviluppo e arriverà presto.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <TrendingUp className="h-8 w-8 text-green-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Investimenti</h3>
                    <p className="text-gray-400 text-sm mt-2">Monitora la crescita dei tuoi asset nel tempo con grafici predittivi.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <PiggyBank className="h-8 w-8 text-pink-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Risparmio</h3>
                    <p className="text-gray-400 text-sm mt-2">Imposta regole automatiche per accantonare risparmi ogni mese.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <Target className="h-8 w-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Obiettivi</h3>
                    <p className="text-gray-400 text-sm mt-2">Definisci traguardi specifici (es. Casa, Auto) e quanto ti manca.</p>
                </div>
            </div>

            <div className="pt-8">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> Crea Progetto (Demo)
                </Button>
            </div>
        </div>
    )
}
