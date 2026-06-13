"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type SelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  description?: string;
};

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  required = false,
  description,
}: FormSelectProps) {
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
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger
              id={name}
              className={fieldState.invalid ? "border-destructive" : undefined}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
