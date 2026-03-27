import { Navbar } from "@/components/Navbar"
import { SetupWizard } from "@/components/SetupWizard"

export default function WizardPage() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <SetupWizard />
      </main>
    </div>
  )
}
