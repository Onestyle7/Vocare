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
                                : DateTime.Parse(src.StartDate)
                        )
                )
                .ForMember(
                    dest => dest.EndDate,
                    opt =>
                        opt.MapFrom(src =>
                            string.IsNullOrEmpty(src.EndDate)
                                ? (DateTime?)null
                                : DateTime.Parse(src.EndDate)
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
                                : DateTime.Parse(src.Date).ToUniversalTime()
                        )
                )
                .ReverseMap();

            // Mapowanie dla WorkExperienceEntry na WorkExperienceEntryDto
            CreateMap<WorkExperienceEntryDto, WorkExperienceEntry>()
                .ForMember(
                    dest => dest.EndDate,
                    opt =>
                        opt.MapFrom(src =>
                            src.EndDate == "Present" || string.IsNullOrEmpty(src.EndDate)
                                ? (DateTime?)null
                                : DateTime.Parse(src.EndDate).ToUniversalTime()
                        )
                )
                .ForMember(
                    dest => dest.StartDate,
                    opt =>
                        opt.MapFrom(src =>
                            string.IsNullOrEmpty(src.StartDate)
                                ? (DateTime?)null
                                : DateTime.Parse(src.StartDate).ToUniversalTime()
                        )
                )
                .ForMember(
                    dest => dest.Description,
                    opt => opt.MapFrom(src => src.Description ?? string.Empty)
                )
                .ReverseMap();

            // Mapowanie dla CertificateEntry na CertificateEntryDto
            CreateMap<CertificateEntry, CertificateEntryDto>()
                .ReverseMap();

            // Mapowanie dla LanguageEntry na LanguageEntryDto
            CreateMap<LanguageEntry, LanguageEntryDto>()
                .ReverseMap();

            // Mapowanie dla UserProfile na UserProfileDto
            CreateMap<UserProfile, UserProfileDto>()
                .ReverseMap();
        }
    }
}
