import { KineticTextLoader } from "@/components/ui/kinetic-text-loader"

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center p-8 bg-background/50 backdrop-blur-sm">
      <KineticTextLoader text="Loading" className="scale-110" />
    </div>
  )
}
