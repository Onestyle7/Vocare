using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    //To Dto słuzy do transfery danych między serwisem a API perplexity
    public class SkillDemandDto
    {
        public string Skill { get; set; }
        public string DemandLevel { get; set; }
        public string Industry { get; set; }
    }
}
