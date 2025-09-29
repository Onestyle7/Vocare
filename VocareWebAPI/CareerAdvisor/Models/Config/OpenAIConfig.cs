using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.OpenAIConfig
{
    /// <summary>
    /// Klasa konfiguracyjna dla OpenAI.
    /// </summary>
    public class OpenAIConfig
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
    }
}
