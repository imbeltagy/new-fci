import { NearAssessments } from "@/sections/home/near-assessments";
import { OpenAssessments } from "@/sections/home/open-assessments";
import { MySubjectsView } from "@/sections/subjects/view/my-subjects-view";

export default function HomePage() {
  return (
    <div className="space-y-6 py-4">
      <OpenAssessments />
      <NearAssessments />
      <MySubjectsView />
    </div>
  );
}
