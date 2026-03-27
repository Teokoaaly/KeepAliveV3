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
    <div className="flex items-center justify-center space-x-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center border-2 text-sm font-bold transition-all",
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
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 transition-colors",
                index < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
