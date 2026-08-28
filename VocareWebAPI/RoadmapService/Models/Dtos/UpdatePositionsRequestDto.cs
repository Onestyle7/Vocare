using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class UpdatePositionsRequestDto
    {
        public List<StepPositionDto> Positions { get; set; }
    }
}
