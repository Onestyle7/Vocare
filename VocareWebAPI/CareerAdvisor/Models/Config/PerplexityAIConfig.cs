using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CareerAdvisor.Models.Config
{
    /// <summary>
    /// Klasa konfiguracyjna dla Perplexity AI.
    /// </summary>
    public class PerplexityAIConfig
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
    }
}
