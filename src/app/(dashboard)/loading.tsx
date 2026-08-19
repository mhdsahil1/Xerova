import { KineticTextLoader } from "@/components/ui/kinetic-text-loader"

export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center p-8">
      <KineticTextLoader text="Loading" className="scale-100 opacity-80" />
    </div>
  )
}
