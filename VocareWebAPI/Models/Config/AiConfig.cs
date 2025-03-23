using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Config
{
    public class AiConfig
    {
        public string BaseUrl { get; set; }
        public string ApiKey { get; set; }
        public string Model { get; set; }
    }
}
