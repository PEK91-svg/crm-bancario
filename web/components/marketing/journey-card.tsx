import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, BarChart2, MoreHorizontal, PlayCircle, PauseCircle } from "lucide-react"

export function JourneyCard({ journey }: { journey: any }) {
    const isActive = journey.status === 'active'

    return (
        <Card className="group hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                        {journey.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
                <CardTitle className="mt-2 text-xl group-hover:text-cyan-400 transition-colors">{journey.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                    {journey.description || 'No description provided.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-white/5 my-2">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Enrolled</span>
                        <span className="text-xl font-bold text-white mt-1">{journey.totalEnrollments || 0}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><BarChart2 className="h-3 w-3" /> Conversion</span>
                        <span className="text-xl font-bold text-white mt-1">{journey.conversionRate || '0%'}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="w-full bg-transparent border-white/10 hover:bg-white/5">
                    View Details
                </Button>
                <Button size="icon" variant={isActive ? "secondary" : "default"} className={isActive ? "text-yellow-500" : "bg-cyan-600"}>
                    {isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </Button>
            </CardFooter>
        </Card>
    )
}
