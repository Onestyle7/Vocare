import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  phoneNumber: z.string().optional(),
  education: z.string().min(1, "Required"),
  workExperience: z.array(z.string()).nonempty("At least one required"),
  skills: z.array(z.string()).nonempty("At least one required"),
  certificates: z.array(z.string()).optional(),
  languages: z.array(z.string()).nonempty("At least one required"),
  additionalInformation: z.string().optional(),
  aboutMe: z.string().min(1, "Required"),
});

export type ProfileFormType = z.infer<typeof profileSchema>;
