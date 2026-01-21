"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import * as z from "zod"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

// Validation schema matching backend
const contactFormSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    role: z.string().optional(),
    accountId: z.string().optional(),
    isPrimary: z.boolean().default(false),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

interface ContactFormProps {
    accountId?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export function ContactForm({ accountId, onSuccess, onCancel }: ContactFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const form = useForm({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: "",
            accountId: accountId || "",
            isPrimary: false,
        },
    })

    const createContact = useMutation({
        mutationFn: async (data: ContactFormValues) => {
            return api.post("contacts", { json: data }).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] })
            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/customers")
            }
        },
    })

    function onSubmit(data: ContactFormValues) {
        createContact.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="+39 123 456 7890" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Account Manager" {...field} />
                            </FormControl>
                            <FormDescription>
                                Contact's role or title
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={createContact.isPending}>
                        {createContact.isPending ? "Creating..." : "Create Contact"}
                    </Button>
                </div>

                {createContact.isError && (
                    <div className="text-sm text-destructive">
                        Error creating contact. Please try again.
                    </div>
                )}
            </form>
        </Form>
    )
}
