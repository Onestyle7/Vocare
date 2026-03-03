using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper.Internal.Mappers;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class GeneratedStepDto
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public List<string> Topics { get; set; }
        public string StepType { get; set; }
        public int OrderIndex { get; set; }
        public string? ParentRef { get; set; } //Tymczasowy id rodzica z llm
        public string TempId { get; set; } // tymczasowy id kroku
    }
}
