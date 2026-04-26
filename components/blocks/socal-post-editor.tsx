import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit3, Save, FileText, Loader2, Share2, Check, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

type ContentProject = Doc<"contentProjects">;
type SocialPlatform = "twitter" | "linkedin" | "facebook" | "instagram" | "medium";
export function SocialPostsEditor({ project }: { project: ContentProject }) {
    const updateSocialPost = useMutation(api.contentProjects.updateSocialPost);
    const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    const platforms: {
        key: SocialPlatform;
        label: string;
        color: string;
        bg: string;
        icon: React.ComponentType<{ className?: string }>;
    }[] = [
            { key: "twitter", label: "Twitter/X", color: "bg-black", bg: "bg-gray-100", icon: Share2 },
            { key: "linkedin", label: "LinkedIn", color: "bg-blue-600", bg: "bg-blue-50", icon: Share2 },
            { key: "facebook", label: "Facebook", color: "bg-blue-500", bg: "bg-blue-50", icon: Share2 },
            { key: "instagram", label: "Instagram", color: "bg-pink-500", bg: "bg-pink-50", icon: Share2 },
            { key: "medium", label: "Medium", color: "bg-slate-800", bg: "bg-slate-50", icon: FileText },
        ];

    const handleEdit = (platform: string, text: string) => {
        setEditingPlatform(platform);
        setEditText(text);
    };

    const handleSave = async (platform: string) => {
        try {
            await updateSocialPost({
                projectId: project._id,
                platform: platform as SocialPlatform,
                text: editText,
            });
            toast.success(`${platform} post saved!`);
            setEditingPlatform(null);
        } catch {
            toast.error("Failed to save");
        }
    };

    if (!project.socialPosts) {
        return (
            <div className="text-center py-20 px-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm">
                {project.status === "generating" ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <p className="text-foreground text-lg font-medium tracking-tight">
                            Agents are crafting your social posts...
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This usually takes 10-15 seconds
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <Share2 className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-lg">
                            Social posts will appear here after generation
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const socialPosts = project.socialPosts;

    return (
        <div className="space-y-6">
            {platforms.map((platform) => {
                const post = socialPosts[platform.key];
                return (
                    <div
                        key={platform.key}
                        className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm p-4 sm:p-8 transition-all hover:bg-white/10"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shadow-sm ${platform.color} shrink-0`}>
                                    <platform.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                </div>
                                <span className="font-semibold text-foreground tracking-tight text-base sm:text-lg">{platform.label}</span>
                                {post.status === "published" && (
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-1 sm:ml-2 font-medium tracking-wide text-[10px]">
                                        <Check className="w-3 h-3 mr-1 hidden sm:inline" />
                                        Published
                                    </Badge>
                                )}
                                {post.error && (
                                    <Badge variant="destructive" className="ml-1 sm:ml-2 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 text-[10px]">
                                        <AlertCircle className="w-3 h-3 mr-1 hidden sm:inline" />
                                        Error
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(post.text);
                                        toast.success("Copied to clipboard!");
                                    }}
                                    className="bg-transparent border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                                >
                                    <Copy className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Copy</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(platform.key, post.text)}
                                    className="bg-transparent border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                                >
                                    <Edit3 className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Edit</span>
                                </Button>
                            </div>
                        </div>

                        {editingPlatform === platform.key ? (
                            <div className="space-y-4 bg-background/50 p-6 rounded-2xl border border-white/5">
                                <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={5}
                                    className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-[15px] leading-relaxed p-4 resize-y"
                                />
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditingPlatform(null)}
                                        className="bg-transparent border-white/10 hover:bg-white/5 text-foreground"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleSave(platform.key)}
                                        className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5 rounded-2xl pointer-events-none" />
                                <p className="text-sm sm:text-[15px] text-foreground/90 whitespace-pre-wrap bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10 leading-relaxed font-normal break-words">
                                    {post.text}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
