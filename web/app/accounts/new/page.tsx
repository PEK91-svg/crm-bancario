import { AccountForm } from "@/components/forms/AccountForm";

export default function NewAccountPage() {
    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">New Account</h1>
                <p className="text-muted-foreground">
                    Create a new account record for a customer or business entity.
                </p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <AccountForm />
            </div>
        </div>
    );
}
