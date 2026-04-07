import { Navbar } from "@/components/Navbar"
import { SetupWizard } from "@/components/SetupWizard"

export default function WizardPage() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <SetupWizard />
      </main>
    </div>
  )
}
