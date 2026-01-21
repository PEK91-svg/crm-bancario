"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface DeleteButtonProps {
    entityType: "contact" | "account" | "case" | "pratica"
    entityId: string
    entityName: string
    redirectTo?: string
    onSuccess?: () => void
}

const entityConfig = {
    contact: { endpoint: "contacts", label: "Contact" },
    account: { endpoint: "accounts", label: "Account" },
    case: { endpoint: "cases", label: "Case" },
    pratica: { endpoint: "pratiche", label: "Pratica" },
}

export function DeleteButton({
    entityType,
    entityId,
    entityName,
    redirectTo,
    onSuccess
}: DeleteButtonProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const config = entityConfig[entityType]

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return api.delete(`${config.endpoint}/${entityId}`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [config.endpoint] })
            if (onSuccess) {
                onSuccess()
            } else if (redirectTo) {
                router.push(redirectTo)
            }
        },
    })

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete <span className="font-semibold">{entityName}</span>.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            deleteMutation.mutate()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
                {deleteMutation.isError && (
                    <p className="text-sm text-destructive px-6 pb-4">
                        Failed to delete. Please try again.
                    </p>
                )}
            </AlertDialogContent>
        </AlertDialog>
    )
}
