import Link from "next/link"
import {Ban} from "lucide-react"
import {Button} from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="m-auto max-w-sm">
      <div className="flex flex-col items-center gap-2 justify-center">
        <Ban className="w-10 h-10" />
        <h2>Not Found</h2>
        <div />
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  )
}
