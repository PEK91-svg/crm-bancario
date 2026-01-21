"use client"

import { Card } from "@/components/ui/card"
import { ContactForm } from "@/components/forms/ContactForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewContactPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">New Contact</h1>
                    <p className="text-muted-foreground">Create a new customer contact</p>
                </div>
            </div>

            <Card className="p-6 max-w-2xl">
                <ContactForm />
            </Card>
        </div>
    )
}
