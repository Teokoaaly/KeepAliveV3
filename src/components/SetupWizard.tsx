"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StepIndicator } from "@/components/ui/stepper"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Server,
  Globe,
  Settings,
  Zap,
} from "lucide-react"

interface WizardData {
  supabaseAlias: string
  contactEmail: string
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
  keepaliveEndpointUrl: string
  keepaliveMethod: "GET" | "POST"
  keepaliveHeaders: string
  keepaliveBody: string
  intervalSeconds: number
  vercelToken: string
  vercelTeamId: string
}

export function SetupWizard() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const steps = [
    {
      id: "supabase",
      title: t("stepSupabase"),
      description: t("stepSupabaseDesc"),
    },
    {
      id: "keepalive",
      title: t("stepKeepalive"),
      description: t("stepKeepaliveDesc"),
    },
    {
      id: "vercel",
      title: t("stepVercel"),
      description: t("stepVercelDesc"),
    },
    {
      id: "review",
      title: t("stepReview"),
      description: t("stepReviewDesc"),
    },
  ]

  const [data, setData] = useState<WizardData>({
    supabaseAlias: "",
    contactEmail: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    supabaseServiceRoleKey: "",
    keepaliveEndpointUrl: "",
    keepaliveMethod: "GET",
    keepaliveHeaders: "{}",
    keepaliveBody: "",
    intervalSeconds: 300,
    vercelToken: "",
    vercelTeamId: "",
  })

  const userEditedEndpoint = useRef(false)
  const userEditedHeaders = useRef(false)

  const updateField = useCallback(<K extends keyof WizardData>(
    field: K,
    value: WizardData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Auto-fill endpoint and headers when entering step 1
  useEffect(() => {
    if (currentStep === 1 && data.supabaseUrl && data.supabaseAnonKey) {
      if (!userEditedEndpoint.current && !data.keepaliveEndpointUrl) {
        const baseUrl = data.supabaseUrl.replace(/\/$/, "")
        updateField("keepaliveEndpointUrl", `${baseUrl}/rest/v1/`)
      }
      if (!userEditedHeaders.current && data.keepaliveHeaders === "{}") {
        const autoHeaders = JSON.stringify(
          {
            apikey: data.supabaseAnonKey,
            Authorization: `Bearer ${data.supabaseAnonKey}`,
          },
          null,
          2
        )
        updateField("keepaliveHeaders", autoHeaders)
      }
    }
  }, [
    currentStep,
    data.keepaliveEndpointUrl,
    data.keepaliveHeaders,
    data.supabaseAnonKey,
    data.supabaseUrl,
    updateField,
  ])

  const validateStep = (step: number): boolean => {
    setError(null)

    switch (step) {
      case 0:
        if (!data.supabaseAlias.trim()) {
          setError(t("aliasRequired"))
          return false
        }
        if (!data.contactEmail.trim()) {
          setError(t("contactEmailRequired"))
          return false
        }
        if (!data.contactEmail.includes("@")) {
          setError(t("invalidEmail"))
          return false
        }
        if (!data.supabaseUrl.trim()) {
          setError(t("urlRequired"))
          return false
        }
        if (!data.supabaseUrl.includes("supabase.co")) {
          setError(t("invalidUrl"))
          return false
        }
        if (!data.supabaseAnonKey.trim()) {
          setError(t("anonRequired"))
          return false
        }
        return true

      case 1:
        if (!data.keepaliveEndpointUrl.trim()) {
          setError(t("endpointRequired2"))
          return false
        }
        try {
          new URL(data.keepaliveEndpointUrl)
        } catch {
          setError(t("invalidEndpoint"))
          return false
        }
        if (data.keepaliveHeaders) {
          try {
            JSON.parse(data.keepaliveHeaders)
          } catch {
            setError(t("headersJson"))
            return false
          }
        }
        if (data.keepaliveMethod === "POST" && data.keepaliveBody) {
          try {
            JSON.parse(data.keepaliveBody)
          } catch {
            setError(t("bodyJson"))
            return false
          }
        }
        if (data.intervalSeconds < 60) {
          setError(t("intervalMin"))
          return false
        }
        return true

      case 2:
        return true

      case 3:
        return true

      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabaseResponse = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias_email: data.supabaseAlias,
          contact_email: data.contactEmail,
          supabase_url: data.supabaseUrl,
          anon_key: data.supabaseAnonKey,
          service_role_key: data.supabaseServiceRoleKey || undefined,
          keepalive_endpoint_url: data.keepaliveEndpointUrl,
          keepalive_method: data.keepaliveMethod,
          keepalive_headers: data.keepaliveHeaders
            ? JSON.parse(data.keepaliveHeaders)
            : {},
          keepalive_body:
            data.keepaliveMethod === "POST" && data.keepaliveBody
              ? JSON.parse(data.keepaliveBody)
              : null,
          interval_seconds: data.intervalSeconds,
        }),
      })

      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json()
        throw new Error(
          errorData.error || t("failedCreate")
        )
      }

      if (data.vercelToken) {
        const vercelResponse = await fetch("/api/vercel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: data.vercelToken,
            team_id: data.vercelTeamId || undefined,
          }),
        })

        if (!vercelResponse.ok) {
          console.warn(t("vercelFailed"))
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR: UNKNOWN EXCEPTION")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-primary glow-text uppercase tracking-[2px]">
              {t("configComplete")}
            </h2>
            <p className="text-muted-foreground text-center uppercase tracking-wider">
              {t("configSaved")}
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary glow-text uppercase tracking-[3px]">
          {t("setupWizard")}
        </h1>
        <p className="text-muted-foreground uppercase tracking-wider">
          {t("wizardDesc")}
        </p>
      </div>

      <StepIndicator steps={steps} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 0 && <Server className="h-5 w-5" />}
            {currentStep === 1 && <Zap className="h-5 w-5" />}
            {currentStep === 2 && <Globe className="h-5 w-5" />}
            {currentStep === 3 && <Settings className="h-5 w-5" />}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive border-2 border-destructive bg-destructive/10 font-bold uppercase tracking-wider animate-pulse">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary border border-border">
                <h3 className="font-bold mb-2 uppercase tracking-wider text-primary">
                  {t("howToGetCredentials")}
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside uppercase tracking-wider">
                  <li>{t("step1")}</li>
                  <li>{t("step2")}</li>
                  <li>{t("step3")}</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label htmlFor="alias" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("aliasProjectName")}
                </label>
                <Input
                  id="alias"
                  placeholder="my-project@example.com"
                  value={data.supabaseAlias}
                  onChange={(e) => updateField("supabaseAlias", e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-email" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("contactEmail")}
                </label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder={t("contactEmailPlaceholder")}
                  value={data.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t("contactEmailHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("supabaseUrlRequired")}
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={data.supabaseUrl}
                  onChange={(e) => updateField("supabaseUrl", e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="anon" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("anonKeyRequired")}{" "}
                  <Badge variant="outline" className="text-xs">{t("badgePublic")}</Badge>
                </label>
                <Input
                  id="anon"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={data.supabaseAnonKey}
                  onChange={(e) =>
                    updateField("supabaseAnonKey", e.target.value)
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="service" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("serviceRoleOptional")}{" "}
                  <Badge variant="secondary" className="text-xs">{t("badgeOptional")}</Badge>
                </label>
                <Input
                  id="service"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={data.supabaseServiceRoleKey}
                  onChange={(e) =>
                    updateField("supabaseServiceRoleKey", e.target.value)
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary border border-border">
                <h3 className="font-bold mb-2 uppercase tracking-wider text-primary">
                  {t("keepaliveConfiguration")}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {t("keepaliveDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="endpoint" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("endpointRequired")}
                </label>
                <Input
                  id="endpoint"
                  type="url"
                  placeholder="https://your-project.supabase.co/rest/v1/"
                  value={data.keepaliveEndpointUrl}
                  onChange={(e) => {
                    userEditedEndpoint.current = true
                    updateField("keepaliveEndpointUrl", e.target.value)
                  }}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="method" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("httpMethodLabel")}
                </label>
                <select
                  id="method"
                  className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono uppercase tracking-wider focus:border-primary focus:outline-none focus:shadow-[0_0_5px_hsl(var(--primary)/0.5)]"
                  value={data.keepaliveMethod}
                  onChange={(e) =>
                    updateField(
                      "keepaliveMethod",
                      e.target.value as "GET" | "POST"
                    )
                  }
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="headers" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("customHeadersLabel")}{" "}
                  <Badge variant="outline" className="text-xs">{t("badgeJsonOptional")}</Badge>
                </label>
                <textarea
                  id="headers"
                  className="flex min-h-[80px] w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono text-xs focus:border-primary focus:outline-none focus:shadow-[0_0_5px_hsl(var(--primary)/0.5)]"
                  placeholder='{"apikey": "...", "Authorization": "Bearer ..."}'
                  value={data.keepaliveHeaders}
                  onChange={(e) => {
                    userEditedHeaders.current = true
                    updateField("keepaliveHeaders", e.target.value)
                  }}
                />
              </div>

              {data.keepaliveMethod === "POST" && (
                <div className="space-y-2">
                  <label htmlFor="body" className="text-sm font-bold uppercase tracking-wider text-primary">
                    {t("requestBodyLabel")}{" "}
                    <Badge variant="outline" className="text-xs">{t("badgeJsonOptional")}</Badge>
                  </label>
                  <textarea
                    id="body"
                    className="flex min-h-[80px] w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono text-xs focus:border-primary focus:outline-none focus:shadow-[0_0_5px_hsl(var(--primary)/0.5)]"
                    placeholder='{"key": "value"}'
                    value={data.keepaliveBody}
                    onChange={(e) =>
                      updateField("keepaliveBody", e.target.value)
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="interval" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("intervalLabel")}{" "}
                  <Badge variant="outline" className="text-xs">{t("badgeMinDefault")}</Badge>
                </label>
                <Input
                  id="interval"
                  type="number"
                  min={60}
                  value={data.intervalSeconds}
                  onChange={(e) =>
                    updateField(
                      "intervalSeconds",
                      parseInt(e.target.value) || 300
                    )
                  }
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary border border-border">
                <h3 className="font-bold mb-2 uppercase tracking-wider text-primary">
                  {t("connectVercel")}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {t("vercelDesc")}
                </p>
              </div>

              <div className="p-4 border-2 border-border">
                <h4 className="font-bold mb-2 uppercase tracking-wider text-primary">
                  {t("howToGetToken")}
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside uppercase tracking-wider">
                  <li>{t("vercelStep1")}</li>
                  <li>{t("vercelStep2")}</li>
                  <li>{t("vercelStep3")}</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label htmlFor="vercel-token" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("vercelToken")}{" "}
                  <Badge variant="secondary" className="text-xs">{t("badgeOptional2")}</Badge>
                </label>
                <Input
                  id="vercel-token"
                  type="password"
                  placeholder="YOUR VERCEL TOKEN"
                  value={data.vercelToken}
                  onChange={(e) => updateField("vercelToken", e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vercel-team" className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("teamId")}{" "}
                  <Badge variant="secondary" className="text-xs">{t("badgeTeamsOnly")}</Badge>
                </label>
                <Input
                  id="vercel-team"
                  placeholder="YOUR VERCEL TEAM ID"
                  value={data.vercelTeamId}
                  onChange={(e) => updateField("vercelTeamId", e.target.value)}
                  className="font-mono"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentStep(3)}
              >
                {t("skipForNow")}
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-secondary border border-border">
                <h3 className="font-bold mb-2 uppercase tracking-wider text-primary">
                  {t("configSummary")}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {t("reviewDesc")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-border p-4">
                  <h4 className="font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-primary">
                    <Server className="h-4 w-4" />
                    {t("supabaseConfiguration")}
                  </h4>
                  <dl className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">{t("alias")}:</dt>
                      <dd>{data.supabaseAlias}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">{t("email")}:</dt>
                      <dd>{data.contactEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">URL:</dt>
                      <dd className="truncate max-w-[200px]">
                        {data.supabaseUrl}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">{t("anonKey")}:</dt>
                      <dd className="truncate max-w-[200px]">
                        {data.supabaseAnonKey.slice(0, 20)}...
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">
                        {t("serviceRoleKey")}:
                      </dt>
                      <dd>
                        {data.supabaseServiceRoleKey ? (
                          <Badge variant="terminal" className="text-xs">{t("configured")}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{t("notSet")}</Badge>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-2 border-border p-4">
                  <h4 className="font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-primary">
                    <Zap className="h-4 w-4" />
                    {t("keepaliveConfigurationTitle")}
                  </h4>
                  <dl className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">{t("endpoint")}:</dt>
                      <dd className="truncate max-w-[200px]">
                        {data.keepaliveEndpointUrl}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">METHOD:</dt>
                      <dd>{data.keepaliveMethod}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground uppercase">{t("interval")}:</dt>
                      <dd>{data.intervalSeconds}S</dd>
                    </div>
                  </dl>
                </div>

                {data.vercelToken && (
                  <div className="border-2 border-border p-4">
                    <h4 className="font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-primary">
                      <Globe className="h-4 w-4" />
                      {t("vercelConfiguration")}
                    </h4>
                    <dl className="space-y-1 text-sm font-mono">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground uppercase">TOKEN:</dt>
                        <dd>
                          <Badge variant="terminal" className="text-xs">{t("configured")}</Badge>
                        </dd>
                      </div>
                      {data.vercelTeamId && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground uppercase">TEAM ID:</dt>
                          <dd>{data.vercelTeamId}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button variant="terminal" onClick={handleNext} disabled={loading}>
                {t("next")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button variant="terminal" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("processing2")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t("completeSetup")}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
