"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/profile";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/app/types/profile";
import { toast } from "sonner";

export default function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getUserProfile(token);
        setProfile(data);
      } catch (error) {
        console.error(error);
        toast.error("Provide additional information", {
          description: "Filling the Profile Form will allow You to use the full power of Vocare.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div className="mt-6">No profile data available.</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
      <p><strong>Country:</strong> {profile.country}</p>
      <p><strong>Address:</strong> {profile.address}</p>
      <p><strong>Phone:</strong> {profile.phoneNumber}</p>
      <p><strong>Education:</strong> {profile.education}</p>
      <p><strong>About Me:</strong> {profile.aboutMe}</p>
      <p><strong>Additional Information:</strong> {profile.additionalInformation}</p>

      <h2 className="font-semibold">Skills</h2>
      <ul>
        {profile.skills.map((skill, index) => <li key={index}>{skill}</li>)}
      </ul>

      <h2 className="font-semibold">Work Experience</h2>
      <ul>
        {profile.workExperience.map((exp, index) => <li key={index}>{exp}</li>)}
      </ul>

      <h2 className="font-semibold">Languages</h2>
      <ul>
        {profile.languages.map((lang, index) => <li key={index}>{lang}</li>)}
      </ul>

      <h2 className="font-semibold">Certificates</h2>
      <ul>
        {profile.certificates.map((cert, index) => <li key={index}>{cert}</li>)}
      </ul>
    </div>
  );
}
