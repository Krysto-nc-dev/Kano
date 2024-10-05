"use client";
import { Tag } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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
} from "../ui/alert-dialog";
import TagComponent from "./tag";
import { PlusCircleIcon, TrashIcon, X } from "lucide-react";
import { toast } from "../ui/use-toast";
import { v4 } from "uuid";
import {
  deleteTag,
  getTagsForSubaccount,
  saveActivityLogsNotification,
  upsertTag,
} from "@/lib/queries";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type Props = {
  subAccountId: string;
  getSelectedTags: (tags: Tag[]) => void;
  defaultTags?: Tag[];
};

const TagColors = ["BLEU", "ORANGE", "ROSE", "VIOLET", "VERT"] as const;
export type TagColor = (typeof TagColors)[number];

const TagCreator = ({ getSelectedTags, subAccountId, defaultTags }: Props) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(defaultTags || []);
  const [tags, setTags] = useState<Tag[]>([]);
  const router = useRouter();
  const [value, setValue] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    getSelectedTags(selectedTags);
  }, [selectedTags]);

  useEffect(() => {
    if (subAccountId) {
      const fetchData = async () => {
        const response = await getTagsForSubaccount(subAccountId);
        if (response) setTags(response.Tags);
      };
      fetchData();
    }
  }, [subAccountId]);

  const handleDeleteSelection = (tagId: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const handleAddTag = async () => {
    if (!value) {
      toast({
        variant: "destructive",
        title: "Les tags doivent avoir un nom",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        variant: "destructive",
        title: "Veuillez sélectionner une couleur",
      });
      return;
    }
    const tagData: Tag = {
      color: selectedColor,
      createdAt: new Date(),
      id: v4(),
      name: value,
      subAccountId,
      updatedAt: new Date(),
    };

    setTags([...tags, tagData]);
    setValue("");
    setSelectedColor("");
    try {
      const response = await upsertTag(subAccountId, tagData);
      toast({
        title: "Tag créé",
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Mise à jour d'un tag | ${response?.name}`,
        subaccountId: subAccountId,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible de créer le tag",
      });
    }
  };

  const handleAddSelections = (tag: Tag) => {
    if (selectedTags.every((t) => t.id !== tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  const handleDeleteTag = async (tagId: string) => {
    setTags(tags.filter((tag) => tag.id !== tagId));
    try {
      const response = await deleteTag(tagId);
      toast({
        title: "Tag supprimé",
        description: "Le tag a été supprimé de votre sous-compte.",
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Tag supprimé | ${response?.name}`,
        subaccountId: subAccountId,
      });

      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible de supprimer le tag",
      });
    }
  };

  return (
    <AlertDialog>
      <Command className="bg-transparent">
        {!!selectedTags.length && (
          <div className="flex flex-wrap gap-2 p-2 bg-background border-2 border-border rounded-md">
            {selectedTags.map((tag) => (
              <div key={tag.id} className="flex items-center">
                <TagComponent title={tag.name} colorName={tag.color} />
                <X
                  size={14}
                  className="text-muted-foreground cursor-pointer"
                  onClick={() => handleDeleteSelection(tag.id)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 my-2">
          {TagColors.map((colorName) => (
            <TagComponent
              key={colorName}
              selectedColor={setSelectedColor}
              title=""
              colorName={colorName}
            />
          ))}
        </div>
        <div className="relative">
          <CommandInput
            placeholder="Rechercher un tag..."
            value={value}
            onValueChange={setValue}
          />
          <PlusCircleIcon
            onClick={handleAddTag}
            size={20}
            className="absolute top-1/2 transform -translate-y-1/2 right-2 hover:text-primary transition-all cursor-pointer text-muted-foreground"
          />
        </div>
        <CommandList>
          <CommandSeparator />
          <CommandGroup heading="Tags">
            {tags.map((tag) => (
              <CommandItem
                key={tag.id}
                className="hover:!bg-secondary !bg-transparent flex items-center justify-between !font-light cursor-pointer"
              >
                <div onClick={() => handleAddSelections(tag)}>
                  <TagComponent title={tag.name} colorName={tag.color} />
                </div>

                <AlertDialogTrigger>
                  <TrashIcon
                    size={16}
                    className="cursor-pointer text-muted-foreground hover:text-rose-400  transition-all"
                  />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-left">
                      Êtes-vous absolument sûr ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left">
                      Cette action est irréversible. Cela supprimera
                      définitivement le tag de nos serveurs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="items-center">
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      Supprimer le tag
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        </CommandList>
      </Command>
    </AlertDialog>
  );
};

export default TagCreator;
