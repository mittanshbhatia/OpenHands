import { redirect } from "next/navigation";

/** Sign-in removed — bookmarks and history live on the Saved tab. */
export default function ProfilePage() {
  redirect("/saved");
}
