"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { createRoom } from "@repo/common/actions/rooms.action";
import { Button } from "@repo/common/components/ui/button";
import { DialogFooter } from "@repo/common/components/ui/dialog";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/common/components/ui/select";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { useListSubjectsQuery } from "@repo/common/queries/subjects.query";
import type { RoomType } from "@repo/common/types/room";

const TYPE_OPTIONS: { label: string; value: RoomType }[] = [
  { label: "Community (join year)", value: "community" },
  { label: "Major channel (major × year)", value: "major_channel" },
  { label: "Subject channel", value: "subject_channel" },
];

interface RoomFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function RoomForm({ onSuccess, onCancel }: RoomFormProps) {
  const { data: joinYearsData } = useListJoinYearsQuery();
  const { data: majorsData } = useListMajorsQuery();
  const { data: subjectsData } = useListSubjectsQuery();

  const joinYears = joinYearsData?.data?.joinYears ?? [];
  const majors = majorsData?.data?.majors ?? [];
  const subjects = subjectsData?.data?.subjects ?? [];

  const [type, setType] = useState<RoomType>("community");
  const [joinYearId, setJoinYearId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // A sensible default name derived from the current selection.
  const suggestedName = useMemo(() => {
    if (type === "community") {
      const jy = joinYears.find((j) => j.id === joinYearId);
      return jy ? `${jy.year} Community` : "";
    }
    if (type === "major_channel") {
      const jy = joinYears.find((j) => j.id === joinYearId);
      const m = majors.find((x) => x.id === majorId);
      return m && jy ? `${m.code} ${jy.year}` : "";
    }
    const s = subjects.find((x) => x.id === subjectId);
    return s ? `${s.code} — ${s.name}` : "";
  }, [type, joinYearId, majorId, subjectId, joinYears, majors, subjects]);

  const effectiveName = nameTouched ? name : suggestedName;

  function resetSelections(next: RoomType) {
    setType(next);
    setJoinYearId("");
    setMajorId("");
    setSubjectId("");
  }

  async function handleSubmit() {
    if (!effectiveName.trim()) {
      toast.error("Please provide a name.");
      return;
    }
    const body: Parameters<typeof createRoom>[0] = { name: effectiveName.trim(), type };
    if (type === "community") {
      if (!joinYearId) return toast.error("Select a join year.");
      body.joinYearId = joinYearId;
    } else if (type === "major_channel") {
      if (!majorId || !joinYearId) return toast.error("Select a major and join year.");
      body.majorId = majorId;
      body.joinYearId = joinYearId;
    } else {
      if (!subjectId) return toast.error("Select a subject.");
      body.subjectId = subjectId;
    }

    setSubmitting(true);
    const res = await createRoom(body);
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Room created.");
    onSuccess();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => resetSelections(v as RoomType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "community" && (
        <div className="space-y-2">
          <Label>Join Year</Label>
          <Select value={joinYearId} onValueChange={setJoinYearId}>
            <SelectTrigger>
              <SelectValue placeholder="Select join year" />
            </SelectTrigger>
            <SelectContent>
              {joinYears.map((jy) => (
                <SelectItem key={jy.id} value={jy.id}>
                  {jy.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "major_channel" && (
        <>
          <div className="space-y-2">
            <Label>Major</Label>
            <Select value={majorId} onValueChange={setMajorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select major" />
              </SelectTrigger>
              <SelectContent>
                {majors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Join Year</Label>
            <Select value={joinYearId} onValueChange={setJoinYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select join year" />
              </SelectTrigger>
              <SelectContent>
                {joinYears.map((jy) => (
                  <SelectItem key={jy.id} value={jy.id}>
                    {jy.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {type === "subject_channel" && (
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.major.code} {s.joinYear.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="room-name">Name</Label>
        <Input
          id="room-name"
          value={effectiveName}
          onChange={(e) => {
            setName(e.target.value);
            setNameTouched(true);
          }}
          placeholder="Room name"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
}
