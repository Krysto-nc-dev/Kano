'use client'
import { Media } from '@prisma/client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
} from '@/components/ui/alert-dialog'
import { Copy, MoreHorizontal, Trash } from 'lucide-react'
import Image from 'next/image'
import { deleteMedia, saveActivityLogsNotification } from '@/lib/queries'
import { toast } from '../ui/use-toast'

type Props = { file: Media }

const MediaCard = ({ file }: Props) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  return (
    <AlertDialog>
      <DropdownMenu>
        <article className="border w-full rounded-lg bg-slate-900">
          <div className="relative w-full h-40">
            <Image
              src={file.link}
              alt="aperçu de l'image"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <p className="opacity-0 h-0 w-0">{file.name}</p>
          <div className="p-4 relative">
            <p className="text-muted-foreground">
              {file.createdAt.toDateString()}
            </p>
            <p>{file.name}</p>
            <div className="absolute top-4 right-4 p-[1px] cursor-pointer ">
              <DropdownMenuTrigger>
                <MoreHorizontal />
              </DropdownMenuTrigger>
            </div>
          </div>

          <DropdownMenuContent>
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex gap-2"
              onClick={() => {
                navigator.clipboard.writeText(file.link)
                toast({ title: 'Copié dans le presse-papiers' })
              }}
            >
              <Copy size={15} /> Copier le lien
            </DropdownMenuItem>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="flex gap-2">
                <Trash size={15} /> Supprimer le fichier
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </article>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Êtes-vous absolument sûr ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Êtes-vous sûr de vouloir supprimer ce fichier ? Tous les sous-comptes utilisant ce fichier y auront plus accès !
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel className="mb-2">Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive"
            onClick={async () => {
              setLoading(true)
              const response = await deleteMedia(file.id)
              await saveActivityLogsNotification({
                agencyId: undefined,
                description: `Fichier média supprimé | ${response?.name}`,
                subaccountId: response.subAccountId,
              })
              toast({
                title: 'Fichier supprimé',
                description: 'Le fichier a été supprimé avec succès',
              })
              setLoading(false)
              router.refresh()
            }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default MediaCard
