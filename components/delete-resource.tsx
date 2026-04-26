"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"
import { CopyButton } from "./animate-ui/components/buttons/copy"

interface DeleteResourceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceType: string
  resourceName: string
  onDelete: () => Promise<void>
  isDeleting: boolean
  errorMessage?: string
}

export function DeleteResource({
  open,
  onOpenChange,
  resourceType,
  resourceName,
  onDelete,
  isDeleting,
  errorMessage,
}: DeleteResourceProps) {
  const [confirmation, setConfirmation] = useState("")

  useEffect(() => {
    if (!open) {
      setConfirmation("")
    }
  }, [open])

  const isValid = confirmation === "Delete Project"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] lg:max-w-[600px]">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Delete {resourceType}</DialogTitle>
          <DialogDescription className="text-balance text-sm leading-relaxed">
            This action cannot be undone. This will permanently delete the{" "}
            <span className="font-semibold text-foreground italic">
              {resourceName}
            </span>{" "}
            {resourceType.toLowerCase()} and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <div className="grid gap-2">
            <Label htmlFor="confirmation" className="text-sm font-medium text-muted-foreground uppercase tracking-[0.1em] flex flex-wrap items-center gap-x-2 gap-y-2 leading-relaxed">
              <span className="shrink-0">To confirm, type</span>
              <span className="font-bold text-foreground break-all border-b border-foreground/20 pb-0.5 bg-white/5 px-2 rounded-sm">Delete Project</span>
              <div className="flex items-center gap-2">
                <CopyButton content="Delete Project"/>
                <span className="shrink-0">below</span>
              </div>
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Delete Project"
              className="h-10"
              autoComplete="off"
            />
          </div>
          {errorMessage && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter className="mt-2 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!isValid || isDeleting}
            onClick={onDelete}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
