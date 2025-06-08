using AutoMapper;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.Profiles
{
    /// <summary>
    /// Profil AutoMapper dla mapowania między encją UserProfile a UserProfileDto
    /// </summary>
    public class UserProfileMappingProfile : Profile
    {
        /// <summary>
        /// Inicjalizacja profilu mapowania
        /// </summary>
        public UserProfileMappingProfile()
        {
            CreateMap<EducationEntryDto, EducationEntry>()
                .ForMember(
                    dest => dest.StartDate,
                    opt =>
                        opt.MapFrom(src =>
                            string.IsNullOrEmpty(src.StartDate)
                                ? (DateTime?)null
                                : DateTime.SpecifyKind(
                                    DateTime.Parse(src.StartDate),
                                    DateTimeKind.Utc
                                )
                        )
                )
                .ForMember(
                    dest => dest.EndDate,
                    opt =>
                        opt.MapFrom(src =>
                            string.IsNullOrEmpty(src.EndDate)
                                ? (DateTime?)null
                                : DateTime.SpecifyKind(
                                    DateTime.Parse(src.EndDate),
                                    DateTimeKind.Utc
                                )
                        )
                )
                .ReverseMap();

            CreateMap<CertificateEntryDto, CertificateEntry>()
                .ForMember(
                    dest => dest.Date,
                    opt =>
                        opt.MapFrom(src =>
                            string.IsNullOrEmpty(src.Date)
                                ? (DateTime?)null
                                : DateTime.SpecifyKind(DateTime.Parse(src.Date), DateTimeKind.Utc)
                        )
                )
                .ReverseMap();

            CreateMap<FinancialSurvey, FinancialSurveyDto>().ReverseMap();
            CreateMap<WorkExperienceEntryDto, WorkExperienceEntry>()
                .ForMember(
                    dest => dest.StartDate,
                    opt =>
                        opt.MapFrom(src =>
                            string.IsNullOrEmpty(src.StartDate)
                                ? (DateTime?)null
                                : DateTime.SpecifyKind(
                                    DateTime.Parse(src.StartDate),
                                    DateTimeKind.Utc
                                )
                        )
                )
                .ForMember(
                    dest => dest.EndDate,
                    opt =>
                        opt.MapFrom(src =>
                            src.EndDate == "Present" || string.IsNullOrEmpty(src.EndDate)
                                ? (DateTime?)null
                                : DateTime.SpecifyKind(
                                    DateTime.Parse(src.EndDate),
                                    DateTimeKind.Utc
                                )
                        )
                )
                .ForMember(
                    dest => dest.Description,
                    opt => opt.MapFrom(src => src.Description ?? string.Empty)
                )
                .ReverseMap();

            CreateMap<CertificateEntry, CertificateEntryDto>().ReverseMap();

            CreateMap<LanguageEntry, LanguageEntryDto>().ReverseMap();

            CreateMap<UserProfile, UserProfileDto>().ReverseMap();
        }
    }
}
