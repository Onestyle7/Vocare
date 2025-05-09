using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// DTO reprezentujące odpowiedź z API Perplexity
    /// </summary>
    public class PerplexityApiResponseDto
    {
        [JsonPropertyName("choices")]
        public List<ChoiceDto> Choices { get; set; } = new List<ChoiceDto>();
    }

    /// <summary>
    /// DTO reprezentujące pojedyncza odpowiedz z API Perplexity
    /// </summary>
    public class ChoiceDto
    {
        [JsonPropertyName("message")]
        public MessageDto Message { get; set; } = new MessageDto();
    }

    /// <summary>
    /// DTO reprezentujące treść wiadomości z API Perplexity
    /// </summary>
    public class MessageDto
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}
