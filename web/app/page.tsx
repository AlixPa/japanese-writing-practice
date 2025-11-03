import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Japanese Writing Practice
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
          Practice your Japanese writing skills with interactive exercises and personalized learning paths.
        </p>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle>Practice</CardTitle>
            <CardDescription>
              Master the basic hiragana characters with guided practice sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Practice</Button>
          </CardContent>
        </Card>
    </div>
  )
}
