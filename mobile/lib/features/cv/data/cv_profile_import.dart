import '../../profile/data/profile_dates.dart';
import '../../profile/data/user_profile.dart';
import 'cv_models.dart';

/// "Wczytaj dane z profilu" — the client-side twin of the backend's
/// `CvGenerationService.MapUserProfileToCv`.
///
/// The web gets the same result by creating and deleting a temporary CV,
/// which fails at the plan's CV limit. Mapping locally avoids that. Projects,
/// links and hobbies are not part of the profile, so they are kept.
CvData cvDataFromProfile(UserProfile profile, {required CvData current}) {
  return current.copyWith(
    basics: CvBasics(
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phoneNumber ?? '',
      email: profile.email,
      summary: profile.aboutMe ?? '',
      city: profile.address ?? '',
      country: profile.country,
    ),
    work: [
      for (final w in profile.workExperience)
        CvWork(
          company: w.company,
          position: w.position,
          startDate: _date(w.startDate),
          endDate: _endDate(w.endDate, start: w.startDate),
          responsibilities: w.responsibilities.isNotEmpty
              ? w.responsibilities
              : [if (w.description.trim().isNotEmpty) w.description.trim()],
        ),
    ],
    education: [
      for (final e in profile.education)
        CvEducation(
          institution: e.institution,
          degree: e.degree,
          field: e.field,
          startDate: _date(e.startDate),
          endDate: _endDate(e.endDate, start: e.startDate),
        ),
    ],
    certificates: [
      for (final c in profile.certificates)
        CvCertificate(name: c.name, date: _date(c.date)),
    ],
    skills: [...profile.skills],
    languages: [
      for (final l in profile.languages)
        CvLanguage(
          language: l.language,
          fluency: Fluency.normalize(l.level ?? '').value,
        ),
    ],
  );
}

/// Whether the profile has anything worth importing.
bool profileHasCvData(UserProfile profile) =>
    profile.firstName.isNotEmpty ||
    profile.workExperience.isNotEmpty ||
    profile.education.isNotEmpty ||
    profile.skills.isNotEmpty;

String _date(String? value) {
  if (RegExp(r'^\d{4}$').hasMatch((value ?? '').trim())) return value!.trim();
  final parsed = ProfileDates.parse(value);
  return parsed == null ? (value ?? '').trim() : ProfileDates.store(parsed);
}

/// The backend writes `Present` for a missing end date; an entry without
/// any dates stays undated instead of reading "? – obecnie".
String _endDate(String? value, {String? start}) {
  if (ProfileDates.isPresent(value)) return ProfileDates.present;
  if ((value ?? '').trim().isEmpty) {
    return (start ?? '').trim().isEmpty ? '' : ProfileDates.present;
  }
  return _date(value);
}
