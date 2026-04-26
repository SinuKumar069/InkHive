"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, FolderIcon, ArrowRightIcon, Trash2Icon } from "lucide-react"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
import { DeleteResource } from "@/components/delete-resource"
import { useState } from "react"

export function NavProjects({
  projects,
}: {
  projects: {
    id?: Id<"contentProjects">
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const { isMobile } = useSidebar()
  const deleteProject = useMutation(api.contentProjects.deleteProject)
  const router = useRouter()
  const params = useParams()

  const [projectToDelete, setProjectToDelete] = useState<{ id: Id<"contentProjects">, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    try {
      await deleteProject({ projectId: projectToDelete.id })
      toast.success("Project deleted successfully")

      // If we are currently on the deleted project's page, redirect to dashboard
      if (params.projectId === projectToDelete.id) {
        router.push("/dashboard")
      }
      setProjectToDelete(null)
    } catch (error) {
      toast.error("Failed to delete project")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
              {item.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="aria-expanded:bg-muted"
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem>
                      <ArrowRightIcon className="text-muted-foreground" />
                      <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setProjectToDelete({ id: item.id!, name: item.name })}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2Icon className="h-4 w-4" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <DeleteResource
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        resourceType="Project"
        resourceName={projectToDelete?.name || ""}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}
