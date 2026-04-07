"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: string
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.id} className="md:flex-1">
            {index < currentStep ? (
              <button
                onClick={() => onStepClick?.(index)}
                className="group flex flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-bold text-primary group-hover:text-accent uppercase tracking-wider">
                  [{step.title}]
                </span>
                {step.description && (
                  <span className="text-sm text-muted-foreground">
                    {'>'} {step.description}
                  </span>
                )}
              </button>
            ) : index === currentStep ? (
              <div
                className="flex flex-col border-l-4 border-accent py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 shadow-[0_0_10px_hsl(var(--accent)/0.3)]"
                aria-current="step"
              >
                <span className="text-sm font-bold text-accent uppercase tracking-wider glow-accent">
                  {'>'} {step.title} {'<'}
                </span>
                {step.description && (
                  <span className="text-sm text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            ) : (
              <div className="group flex flex-col border-l-4 border-border py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  [ {step.title} ]
                </span>
                {step.description && (
                  <span className="text-sm text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="grid grid-cols-4 gap-2 border-2 border-border bg-secondary/40 p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex min-w-0 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center border-2 text-sm font-bold transition-all sm:h-8 sm:w-8",
                index < currentStep
                  ? "border-primary bg-primary text-background shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                  : index === currentStep
                  ? "border-accent text-accent shadow-[0_0_10px_hsl(var(--accent)/0.5)]"
                  : "border-border text-muted-foreground"
              )}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                "text-center text-[10px] font-bold uppercase tracking-wider sm:hidden",
                index === currentStep ? "text-accent" : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "hidden h-0.5 w-6 transition-colors sm:block sm:w-8",
                index < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
