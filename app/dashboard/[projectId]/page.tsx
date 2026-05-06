"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  AlertCircle,
  FileText,
  Share2,
  Mail,
  Globe,
  Box,
  ArrowLeft,
  XCircle,
  Ban,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { BlogPostEditor } from "@/components/blocks/blog-post-editor";
import { SocialPostsEditor } from "@/components/blocks/socal-post-editor";
import { EmailEditor } from "@/components/blocks/email-editor";
import { SeoEditor } from "@/components/blocks/seo-editor";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as Id<"contentProjects">;

  const project = useQuery(api.contentProjects.getProject, { projectId });
  const projectWithResearch = project as
    | (typeof project & {
        generationMode?: "grounded" | "classic";
        research?: {
          status?: "pending" | "running" | "completed" | "failed" | "skipped";
          errorCode?: string;
          researchedAt?: number;
          sources: Array<{
            title: string;
            url: string;
            domain: string;
          }>;
        };
      })
    | null
    | undefined;
  const [activeTab, setActiveTab] = useState("blog");
  const [isFallbackGenerating, setIsFallbackGenerating] = useState(false);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const cancelMutation = useMutation(api.contentProjects.cancelProject);

  useEffect(() => {
    if (project === null) {
      toast.error("Project not found");
      router.push("/dashboard");
    }
  }, [project, router]);

  useEffect(() => {
    if (
      project &&
      projectWithResearch?.research?.errorCode === "DAILY_QUOTA_EXCEEDED" &&
      projectWithResearch?.generationMode !== "classic"
    ) {
      setShowQuotaDialog(true);
    }
  }, [project, projectWithResearch]);

  if (project === undefined || project === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const jobs = project.jobStatus || {};
  const totalJobs = Object.keys(jobs).length || 5;
  const completedJobs = Object.values(jobs).filter((status) => status === "completed").length;
  const progress = Math.round((completedJobs / totalJobs) * 100);

  const handleGenerateWithoutResearch = async () => {
    setIsFallbackGenerating(true);
    try {
      await fetch("/api/trigger-inngest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          inputType: project.inputType,
          inputContent: project.inputContent,
          generationMode: "classic",
          researchEnabled: false,
        }),
      });
      toast.success("Generating content without web research...");
      setShowQuotaDialog(false);
    } catch (error) {
      console.error("Fallback generation error:", error);
      toast.error("Failed to start classic generation");
    } finally {
      setIsFallbackGenerating(false);
    }
  };

  const handleCancelGeneration = async () => {
    setIsCanceling(true);
    try {
      // Step 1: Mark project as canceled in Convex (authenticated)
      await cancelMutation({ projectId });

      // Step 2: Send cancel event to Inngest to stop the pipeline
      await fetch("/api/cancel-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      toast.success("Generation canceled. Any completed content has been preserved.");
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel generation",
      );
    } finally {
      setIsCanceling(false);
    }
  };

  const tabLinks = [
    {
      label: "Blog Post",
      value: "blog",
      icon: <FileText className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Social Media",
      value: "social",
      icon: <Share2 className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Email",
      value: "email",
      icon: <Mail className="h-4 w-4 shrink-0" />,
    },
    {
      label: "SEO",
      value: "seo",
      icon: <Globe className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <SidebarProvider>
      {/* Quota exceeded dialog */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daily research quota reached</DialogTitle>
            <DialogDescription>
              You have hit Gemini daily web research quota. You can try later or continue with classic generation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
              Try later
            </Button>
            <Button onClick={handleGenerateWithoutResearch} disabled={isFallbackGenerating}>
              {isFallbackGenerating ? "Starting..." : "Generate without web research"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel generation confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Cancel content generation?
            </DialogTitle>
            <DialogDescription>
              This will stop all remaining AI generation steps and save tokens. Any content that has already been generated will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCanceling}
            >
              Keep generating
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelGeneration}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel generation
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {project.blogPost?.title || "Content Project"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <StatusBadge status={project.status} />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 pt-4 md:p-6">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-[100px]" />
            
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                  <Box className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="truncate text-lg font-bold tracking-tight text-foreground md:text-xl">
                      {project.blogPost?.title || "AI Content Task"}
                    </h1>
                    {projectWithResearch?.generationMode === "classic" && (
                      <Badge variant="outline" className="border-amber-400/40 bg-amber-500/10 text-amber-300">
                        Classic mode (no live research)
                      </Badge>
                    )}
                    {projectWithResearch?.generationMode === "grounded" && projectWithResearch?.research?.status === "completed" && (
                      <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
                        Realtime grounded
                      </Badge>
                    )}
                    <Badge variant="outline" className="hidden h-4 border-white/10 bg-white/5 px-1.5 py-0 text-[10px] uppercase tracking-wider text-muted-foreground md:flex">
                      {project.inputType}
                    </Badge>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground md:text-sm max-w-2xl">
                    <span className="font-medium text-foreground/60">{project.inputType === "topic" ? "Topic" : "Article"}:</span> {project.inputContent}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-center">
                {/* Cancel button — only visible while generating */}
                {project.status === "generating" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isCanceling}
                    className="border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/50 transition-all"
                  >
                    {isCanceling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Cancel generation</span>
                    <span className="sm:hidden">Cancel</span>
                  </Button>
                )}

                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </div>
            </div>

              {project.status === "generating" && (
                <div className="mt-4 rounded-lg border border-white/10 bg-background/40 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      Agents processing... {progress}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {completedJobs} / {totalJobs} complete
                    </span>
                  </div>
                  <Progress value={progress} aria-label="Agent processing progress" className="h-1.5" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(jobs).map(([name, status]) => (
                      <JobStatusBadge key={name} name={name} status={status} />
                    ))}
                  </div>
                </div>
              )}

              {/* Show canceled banner with partial content info */}
              {project.status === "canceled" && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
                    <Ban className="h-4 w-4" />
                    Generation was canceled
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Any content that was already generated is preserved below.
                  </p>
                  {Object.keys(jobs).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(jobs).map(([name, status]) => (
                        <JobStatusBadge key={name} name={name} status={status} />
                      ))}
                    </div>
                  )}
                </div>
              )}
          </section>

          {/* {projectWithResearch?.research?.status === "completed" && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Research Sources</h2>
                <span className="text-xs text-muted-foreground">
                  {projectWithResearch.research?.researchedAt
                    ? new Date(projectWithResearch.research.researchedAt).toLocaleString()
                    : "No timestamp"}
                </span>
              </div>
              <div className="space-y-1">
                {projectWithResearch.research?.sources.map((source, index) => (
                  <a
                    key={`${source.url}-${index}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm text-primary hover:underline"
                  >
                    {source.title} ({source.domain})
                  </a>
                ))}
              </div>
            </section>
          )} */}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
            <TabsList className="h-auto flex-wrap p-1 w-full md:w-auto ">
              {tabLinks.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="inline-flex items-center gap-2 md:px-3 px-1  data-[state=active]:bg-background data-[state=active]:shadow-sm  data-[state=active]:border data-[state=active]:border-white/10 rounded-lg py-2.5 transition-all"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="blog" className="mt-0">
              <BlogPostEditor project={project} />
            </TabsContent>
            <TabsContent value="social" className="mt-0">
              <SocialPostsEditor project={project} />
            </TabsContent>
            <TabsContent value="email" className="mt-0">
              <EmailEditor project={project} />
            </TabsContent>
            <TabsContent value="seo" className="mt-0">
              <SeoEditor project={project} />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: ReactNode }> = {
    draft: {
      bg: "bg-white/5 border-white/10",
      text: "text-muted-foreground",
      icon: null,
    },
    generating: {
      bg: "bg-primary/10 border-primary/20",
      text: "text-primary",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    completed: {
      bg: "bg-green-500/10 border-green-500/20",
      text: "text-green-500",
      icon: <Check className="h-3 w-3" />,
    },
    failed: {
      bg: "bg-red-500/10 border-red-500/20",
      text: "text-red-500",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    canceled: {
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-500",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const { bg, text, icon } = config[status] || config.draft;

  return (
    <Badge variant="outline" className={`${bg} ${text} px-3 py-1 font-medium shadow-sm`}>
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs capitalize tracking-wide">{status}</span>
      </span>
    </Badge>
  );
}

function JobStatusBadge({ name, status }: { name: string; status?: string }) {
  const config: Record<string, { icon: ReactNode; bg: string; text: string }> = {
    pending: {
      icon: <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />,
      bg: "bg-white/5 border border-white/10",
      text: "text-muted-foreground",
    },
    running: {
      icon: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
      bg: "bg-primary/10 border border-primary/20",
      text: "text-primary",
    },
    completed: {
      icon: <Check className="h-3 w-3 text-green-500" />,
      bg: "bg-green-500/10 border border-green-500/20",
      text: "text-green-500",
    },
    failed: {
      icon: <AlertCircle className="h-3 w-3 text-red-500" />,
      bg: "bg-red-500/10 border border-red-500/20",
      text: "text-red-500",
    },
    skipped: {
      icon: <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />,
      bg: "bg-white/5 border border-white/10",
      text: "text-muted-foreground/70",
    },
    canceled: {
      icon: <XCircle className="h-3 w-3 text-amber-500" />,
      bg: "bg-amber-500/10 border border-amber-500/20",
      text: "text-amber-500",
    },
  };

  const { icon, bg, text } = config[status || "pending"] ?? config.pending;

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm ${bg} ${text}`}
    >
      {icon}
      <span className="capitalize tracking-wide">
        {name.replace(/([A-Z])/g, " $1").trim()}
      </span>
    </div>
  );
}
