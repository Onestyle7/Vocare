using VocareWebAPI.CvGenerator.Models.Enums;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class GenerateTargetCvDto
    {
        public Mode Mode { get; set; } = Mode.Tailor;
        public string JobDescription { get; set; }
        public Guid? CvId { get; set; }
        public string? Name { get; set; }
    }
}
