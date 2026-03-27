namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvAnalysisResultDto
    {
        public int OverallScore { get; set; } = 0; // 0-100
        public int TargetPositionScore { get; set; } = 0; // 0-100
        public List<SectionScoreDto> SectionScores { get; set; } = new(); // 0-100
        public List<string> TopImprovements { get; set; } = new();
    }
}
