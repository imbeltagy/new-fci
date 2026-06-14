import { UserProfileView } from "@/sections/users/user-profile-view";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  return <UserProfileView email={decodeURIComponent(email)} />;
}
