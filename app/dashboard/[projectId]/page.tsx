"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  AlertCircle,
  FileText,
  Share2,
  Mail,
  Globe,
  Sparkles,
  Box,
  ArrowLeft,
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

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as Id<"contentProjects">;

  const project = useQuery(api.contentProjects.getProject, { projectId });
  const [activeTab, setActiveTab] = useState("blog");

  useEffect(() => {
    if (project === null) {
      toast.error("Project not found");
      router.push("/dashboard");
    }
  }, [project, router]);

  if (project === undefined || project === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const jobs = project.jobStatus || {};
  const totalJobs = 4;
  const completedJobs = Object.values(jobs).filter((status) => status === "completed").length;
  const progress = Math.round((completedJobs / totalJobs) * 100);

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
          <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Box className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="line-clamp-1 text-base font-semibold tracking-tight text-foreground md:text-lg">
                    {project.blogPost?.title || "AI Content Task"}
                  </h1>
                  <p className="line-clamp-1 text-xs text-muted-foreground md:text-sm">
                    {project.inputType === "topic" ? "Seed" : "Source article"}: {project.inputContent}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>

            {project.status === "generating" && (
              <div className="mt-4 rounded-lg border border-white/10 bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" />
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
          </section>

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
  };

  const { icon, bg, text } = config[status || "pending"];

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
