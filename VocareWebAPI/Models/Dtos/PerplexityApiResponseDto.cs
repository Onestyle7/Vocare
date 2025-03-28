using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos
{
    public class PerplexityApiResponseDto
    {
        [JsonPropertyName("choices")]
        public List<ChoiceDto> Choices { get; set; }
    }

    public class ChoiceDto
    {
        [JsonPropertyName("message")]
        public MessageDto Message { get; set; }
    }

    public class MessageDto
    {
        [JsonPropertyName("content")]
        public string Content { get; set; }
    }
}
