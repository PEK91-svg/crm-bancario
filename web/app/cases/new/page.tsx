import { CaseForm } from "@/components/forms/CaseForm";

export default function NewCasePage() {
    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">New Support Case</h1>
                <p className="text-muted-foreground">
                    Open a new support ticket for a customer issue or request.
                </p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <CaseForm />
            </div>
        </div>
    );
}
