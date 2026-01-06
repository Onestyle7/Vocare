using System.Text;
using Microsoft.Extensions.Options;
using UglyToad.PdfPig;
using VocareWebAPI.CareerAdvisor.Services.Interfaces;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.CareerAdvisor.Services.Implementations
{
    public class CvParserService : ICvParserService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CvParserService> _logger;
        private readonly ICvParseHistoryRepository _cvParseHistoryRepository;
        private readonly OpenAIConfig _config;
        private const long MaxFileSizeBytes = 2 * 1024 * 1024; // 2MB

        public CvParserService(
            HttpClient httpClient,
            ILogger<CvParserService> logger,
            ICvParseHistoryRepository cvParseHistoryRepository,
            IOptions<OpenAIConfig> config
        )
        {
            _config = config.Value;
            _httpClient = httpClient;
            _logger = logger;
            _cvParseHistoryRepository = cvParseHistoryRepository;
        }

        public async Task<UserProfileDto> ParseAndSaveAsync(IFormFile file, string userId)
        {
            string fileType = Path.GetExtension(file.FileName).ToLower();
            if (fileType != ".pdf")
            {
                throw new NotSupportedException(
                    "Nie wspierane rozszerzenie pliku. Obsługiwany format to PDF!"
                );
            }
            long fileSize = file.Length;
            if (fileSize > MaxFileSizeBytes)
            {
                throw new NotSupportedException(
                    "Plik jest zbyt duży. Maksymalny rozmiar pliku to 2MB."
                );
            }
        }

        private async Task<string> ExtractTextFromPdfAsync(IFormFile file)
        {
            var textBuilder = new StringBuilder();

            using (var stream = file.OpenReadStream())
            {
                using (var document = PdfDocument.Open(stream))
                {
                    foreach (var page in document.GetPages())
                    {
                        textBuilder.AppendLine(page.Text);
                    }
                }
            }
            return await Task.FromResult(textBuilder.ToString());
        }
    }
}
