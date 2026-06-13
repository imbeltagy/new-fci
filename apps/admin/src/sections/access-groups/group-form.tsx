"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm, useFormContext, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createGroup, updateGroup } from "@repo/common/actions/access-groups.action";
import { FormInput } from "@repo/common/components/custom/form-input";
import { Button } from "@repo/common/components/ui/button";
import { Checkbox } from "@repo/common/components/ui/checkbox";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import { Label } from "@repo/common/components/ui/label";
import { accessGroupSchema, type AccessGroupSchema } from "@repo/common/schemas/access-group.schema";
import type { AccessGroup } from "@repo/common/types/access-group";
import { permissionsConfig } from "@repo/common/types/access-group";

function PermissionsChecklist() {
  const { watch, setValue } = useFormContext<AccessGroupSchema>();
  const selected = watch("permissionKeys");

  function toggle(key: string) {
    if (selected.includes(key)) {
      setValue("permissionKeys", selected.filter((k: string) => k !== key), { shouldValidate: true });
    } else {
      setValue("permissionKeys", [...selected, key], { shouldValidate: true });
    }
  }

  return (
    <div className="space-y-3">
      <Label>Permissions</Label>
      {Object.values(permissionsConfig).map((pg) => (
        <div key={pg.label} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {pg.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {pg.actions.map((action) => (
              <div key={action.value} className="flex items-center gap-2">
                <Checkbox
                  id={action.value}
                  checked={selected.includes(action.value)}
                  onCheckedChange={() => toggle(action.value)}
                />
                <Label htmlFor={action.value} className="font-normal text-sm">
                  {action.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface GroupFormProps {
  group?: AccessGroup | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const form = useForm<AccessGroupSchema>({
    resolver: yupResolver(accessGroupSchema) as unknown as Resolver<AccessGroupSchema>,
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      permissionKeys: group?.permissions.map((p) => p.key) ?? [],
    },
  });

  useEffect(() => {
    form.reset({
      name: group?.name ?? "",
      description: group?.description ?? "",
      permissionKeys: group?.permissions.map((p) => p.key) ?? [],
    });
  }, [group, form]);

  async function onSubmit(values: AccessGroupSchema) {
    const res = group
      ? await updateGroup(group.id, {
          name: values.name,
          description: values.description || undefined,
          permissionKeys: values.permissionKeys,
        })
      : await createGroup({
          name: values.name,
          description: values.description || undefined,
          permissionKeys: values.permissionKeys,
        });

    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(group ? "Access group updated." : "Access group created.");
    onSuccess();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput name="name" label="Name" placeholder="Group name" required />
        <FormInput name="description" label="Description" placeholder="Optional" />
        <PermissionsChecklist />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
