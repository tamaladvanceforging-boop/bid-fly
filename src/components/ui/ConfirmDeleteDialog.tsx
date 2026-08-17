import React from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  onConfirm: () => void
  isDeleting?: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this record? This operation will remove the data from your workspace.',
  itemName,
  onConfirm,
  isDeleting = false
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Please confirm before permanently removing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {itemName && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 font-mono text-xs font-semibold text-destructive break-words leading-relaxed">
              {itemName}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            disabled={isDeleting}
            className="font-bold gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
