"use client";

import { Controller, useFormContext } from "react-hook-form";

import { cn } from "../../lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type FormInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  description?: string;
  required?: boolean;
};

export function FormInput({
  name,
  label,
  placeholder,
  type = "text",
  description,
  required = false,
}: FormInputProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-1.5">
          <Label htmlFor={name}>
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            value={field.value ?? ""}
            className={cn(fieldState.invalid && "border-destructive focus-visible:ring-destructive")}
          />
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {fieldState.error && (
            <p className="text-xs text-destructive">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
