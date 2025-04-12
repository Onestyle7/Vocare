'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormType, personalityTypes } from '@/schemas/profileSchema';
import {
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserProfile,
} from '@/lib/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types/profile';
import ProfileDetails from '@/components/ProfileDeatail';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { CountryCombobox } from '@/components/CountryCombobox';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { TagInput } from '@/components/TagInput';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProfileForm() {
  const [isLoading, setLoading] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileFormType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
      address: '',
      phoneNumber: '',
      education: '',
      workExperience: [],
      skills: [],
      certificates: [],
      languages: [],
      additionalInformation: '',
      aboutMe: '',
      personalityType: undefined,
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/sign-in');
        return;
      }
      try {
        const profileData = await getUserProfile(token);
        if (profileData) {
          setEditMode(true);
          form.reset(profileData);
        }
      } catch (error) {
        console.error('No existing profile found or error fetching data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [form, router]);

  const onSubmit = async (data: ProfileFormType) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', {
        description: 'Please sign in to continue.',
      });
      router.push('/sign-in');
      return;
    }

    const formattedData: UserProfile = {
      ...data,
      certificates: data.certificates ?? [],
      phoneNumber: data.phoneNumber ?? '',
      additionalInformation: data.additionalInformation ?? '',
    };

    try {
      let profileData;
      if (isEditMode) {
        profileData = await updateUserProfile(formattedData, token);
        toast.success('Profile updated successfully!');
      } else {
        profileData = await createUserProfile(formattedData, token);
        toast.success('Profile created successfully!');
        setEditMode(true);
      }

      // Zapisz dane profilu w localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileData));

      // Przekieruj na stronę /assistant
      router.push('/assistant');
    } catch (error: any) {
      console.error(error);
      toast.error('An error occurred', {
        description: error.response?.data || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', {
        description: 'Please sign in to continue.',
      });
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      await deleteUserProfile(token);
      toast.success('Profile deleted successfully!');
      router.push('/');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred', {
        description: 'Failed to delete profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link className="mb-4 flex space-x-4" href="/">
        <ArrowLeft />
        <span>Go back</span>
      </Link>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Joe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={() => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <CountryCombobox form={form} name="country" />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="4th, Morgan Freeman St." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number (InputOTP) */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="phoneNumber"
                    render={({ field: { onChange, value } }) => (
                      <InputOTP
                        maxLength={9}
                        value={value}
                        onChange={(newValue) => onChange(newValue)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={6} />
                          <InputOTPSlot index={7} />
                          <InputOTPSlot index={8} />
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Education */}
          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education</FormLabel>
                <FormControl>
                  <Input placeholder="Master's degree" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* About Me */}
          <FormField
            control={form.control}
            name="aboutMe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About Me</FormLabel>
                <FormControl>
                  <Textarea placeholder="I like to sing..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Personality Type */}
          <FormField
            control={form.control}
            name="personalityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personality Type</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your personality type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(personalityTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Additional Information */}
          <FormField
            control={form.control}
            name="additionalInformation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Information</FormLabel>
                <FormControl>
                  <Textarea placeholder="And I like to dance..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Skills */}
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add a skill (e.g., JavaScript)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Work Experience */}
          <FormField
            control={form.control}
            name="workExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Experience</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add a work experience (e.g., Software Engineer at XYZ)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Languages */}
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Languages</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add a language (e.g., English)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Certificates */}
          <FormField
            control={form.control}
            name="certificates"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificates</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add a certificate (e.g., AWS Certified Developer)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Przyciski */}
          <Button type="submit" disabled={isLoading} className="flex">
            {isLoading ? 'Saving...' : isEditMode ? 'Update Profile' : 'Save Profile'}
          </Button>

          {isEditMode && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete Profile
            </Button>
          )}
        </form>
      </Form>

      <ProfileDetails />
    </div>
  );
}