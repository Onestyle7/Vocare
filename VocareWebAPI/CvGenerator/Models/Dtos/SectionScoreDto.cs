namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class SectionScoreDto
    {
        public string SectionName { get; set; } = string.Empty;
        public int Score { get; set; } = 0;
        public List<string> Insights { get; set; } = new();
    }
}
