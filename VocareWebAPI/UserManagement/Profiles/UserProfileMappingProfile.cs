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
            // Mapowanie dla EducationEntry na EducationEntryDto
            CreateMap<EducationEntry, EducationEntryDto>()
                .ForMember(dest => dest.Institution, opt => opt.MapFrom(src => src.Institution))
                .ReverseMap();

            // Mapowanie dla WorkExperienceEntry na WorkExperienceEntryDto
            CreateMap<WorkExperienceEntry, WorkExperienceEntryDto>()
                .ForMember(
                    dest => dest.EndDate,
                    opt =>
                        opt.MapFrom(src =>
                            src.EndDate.HasValue
                                ? src.EndDate.Value.ToString("yyyy-MM-dd")
                                : "Obecnie"
                        )
                )
                .ReverseMap()
                .ForMember(
                    dest => dest.EndDate,
                    opt =>
                        opt.MapFrom(src =>
                            src.EndDate == "Obecnie" || string.IsNullOrEmpty(src.EndDate)
                                ? (DateTime?)null
                                : DateTime.Parse(src.EndDate)
                        )
                );

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
