import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, X, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

type ContentProject = Doc<"contentProjects">;
export function SeoEditor({ project }: { project: ContentProject }) {
    const updateSeoMetadata = useMutation(api.contentProjects.updateSeoMetadata);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(project.seoMetadata?.title || "");
    const [description, setDescription] = useState(
        project.seoMetadata?.description || "",
    );
    const [keywords, setKeywords] = useState(
        project.seoMetadata?.keywords?.join(", ") || "",
    );
    const [slug, setSlug] = useState(project.seoMetadata?.slug || "");

    const handleSave = async () => {
        try {
            await updateSeoMetadata({
                projectId: project._id,
                title,
                description,
                keywords: keywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean),
                slug,
            });
            toast.success("SEO metadata saved!");
            setIsEditing(false);
        } catch {
            toast.error("Failed to save");
        }
    };

    if (!project.seoMetadata) {
        return (
            <div className="text-center py-20 px-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm">
                {project.status === "generating" ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <p className="text-foreground text-lg font-medium tracking-tight">
                            Agents are optimizing SEO metadata...
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This usually takes 5-10 seconds
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <Globe className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-lg">
                            SEO metadata will appear here after generation
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const seoMetadata = project.seoMetadata;

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 shadow-sm p-3 sm:p-10 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">SEO Metadata</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                            Optimized for search engines
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (!isEditing) {
                                setTitle(seoMetadata.title);
                                setDescription(seoMetadata.description);
                                setKeywords(seoMetadata.keywords.join(", "));
                                setSlug(seoMetadata.slug);
                            }
                            setIsEditing(!isEditing);
                        }}
                        className="bg-transparent border-white/10 hover:bg-white/5 text-foreground transition-all"
                    >
                        {isEditing ? (
                            <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Data
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-6 bg-background/50 p-4 sm:p-6 rounded-2xl border border-white/5">
                    <div className="space-y-2">
                        <Label className="text-foreground font-medium text-sm ml-1 flex justify-between">
                            <span>Meta Title</span>
                            <span className="text-muted-foreground">{title.length}/60 chars</span>
                        </Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={60}
                            className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl py-3 sm:py-6 text-base sm:text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground font-medium text-sm ml-1 flex justify-between">
                            <span>Meta Description</span>
                            <span className="text-muted-foreground">{description.length}/160 chars</span>
                        </Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={160}
                            className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl resize-none p-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground font-medium text-sm ml-1">
                            Keywords (comma-separated)
                        </Label>
                        <Input
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl py-3 sm:py-6"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground font-medium text-sm ml-1">URL Slug</Label>
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-muted-foreground font-mono text-sm pointer-events-none">/blog/</span>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl py-3 sm:py-6 pl-14 sm:pl-16 font-mono text-sm sm:text-base"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 sm:gap-6 sm:grid-cols-2 w-full">
                    <div className="col-span-full space-y-1.5 sm:space-y-2 p-3.5 sm:p-5 bg-white/5 border border-white/10 rounded-2xl min-w-0 w-full">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1 block ">
                            Meta Title
                        </Label>
                        <p className="text-base sm:text-xl text-primary font-medium tracking-tight break-words">
                            {seoMetadata.title}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                            {seoMetadata.title.length} / 60 characters
                        </p>
                    </div>

                    <div className="col-span-full space-y-1.5 sm:space-y-2 p-3.5 sm:p-5 bg-white/5 border border-white/10 rounded-2xl min-w-0 w-full">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1 block">
                            Meta Description
                        </Label>
                        <p className="text-foreground/90 leading-relaxed text-xs sm:text-[15px] break-words">
                            {seoMetadata.description}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                            {seoMetadata.description.length} / 160 characters
                        </p>
                    </div>

                    <div className="space-y-2 sm:space-y-3 p-3.5 sm:p-5 bg-white/5 border border-white/10 rounded-2xl min-w-0 w-full">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                            Keywords
                        </Label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                            {seoMetadata.keywords.map(
                                (keyword: string, idx: number) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 px-2 sm:px-3 py-1 rounded-md text-[9px] sm:text-xs font-normal tracking-wide"
                                    >
                                        {keyword}
                                    </Badge>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 p-3.5 sm:p-5 bg-white/5 border border-white/10 rounded-2xl min-w-0 w-full">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                            URL Slug
                        </Label>
                        <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                            <span className="text-muted-foreground/60 font-mono text-[10px] sm:text-sm shrink-0">/blog/</span>
                            <span className="font-mono text-primary text-xs sm:text-[15px] whitespace-nowrap">{seoMetadata.slug}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
