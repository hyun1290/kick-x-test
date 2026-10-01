import { redirect } from "next/navigation";
/** The community is split into club and player communities. */
export default function Page() {
  redirect("/community/clubs");
}
