'use client';

import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteInquiryAction } from '../inquiry-actions';

/** Deleting loses the only record of what someone asked for, so it confirms
 *  and names them. Archiving is the reversible option and is one tap away. */
export function DeleteInquiryButton({
  inquiryId,
  name,
}: {
  inquiryId: string;
  name: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this inquiry from {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The message, their contact details and any notes go with it, and this cannot be undone.
            To get it out of the way without losing it, archive it instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <form action={deleteInquiryAction}>
            <input type="hidden" name="id" value={inquiryId} />
            <AlertDialogAction type="submit">Delete</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
