using AutoMapper;
using Microsoft.EntityFrameworkCore.Diagnostics;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Profiles
{
    public class AiRecommendationProfile : Profile
    {
        public AiRecommendationProfile()
        {
            // Główne mapowanie
            CreateMap<AiCareerResponseDto, AiRecommendation>()
                .ForMember(
                    dest => dest.PrimaryPath,
                    opt => opt.MapFrom(src => src.Recommendation.PrimaryPath)
                )
                .ForMember(
                    dest => dest.Justification,
                    opt => opt.MapFrom(src => src.Recommendation.Justification)
                )
                .ForMember(
                    dest => dest.LongTermGoal,
                    opt => opt.MapFrom(src => src.Recommendation.LongTermGoal)
                )
                .ForMember(dest => dest.CareerPaths, opt => opt.MapFrom(src => src.CareerPaths))
                .ForMember(
                    dest => dest.NextSteps,
                    opt =>
                        opt.MapFrom(src =>
                            src.Recommendation.NextSteps.Select(ns => new NextStep { Step = ns })
                        )
                )
                .ReverseMap();

            // Mapowanie dla CareerPath w obie strony
            CreateMap<CareerPathDto, CareerPath>()
                .ForMember(
                    dest => dest.RequiredSkills,
                    opt => opt.MapFrom(src => src.RequiredSkills)
                )
                .ForMember(
                    dest => dest.MarketAnalysis,
                    opt => opt.MapFrom(src => src.MarketAnalysis)
                )
                .ForMember(
                    dest => dest.RecommendedCourses,
                    opt => opt.MapFrom(src => src.RecommendedCourses)
                )
                .ForMember(dest => dest.SwotAnalysis, opt => opt.MapFrom(src => src.SwotAnalysis))
                .ReverseMap(); // Dodaj reverse map

            // Mapowanie dla SWOT w obie strony
            CreateMap<SwotAnalysisDto, SwotAnalysis>()
                .ReverseMap(); // Dodaj reverse map

            // Mapowanie NextStep <-> string
            CreateMap<NextStep, string>()
                .ConvertUsing(ns => ns.Step);
            CreateMap<string, NextStep>().ConvertUsing(s => new NextStep { Step = s });
        }
    }
}
