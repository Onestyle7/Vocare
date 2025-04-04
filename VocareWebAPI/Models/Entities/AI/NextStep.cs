using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities
{
    public class NextStep
    {
        [Key]
        public Guid Id { get; set; }
        public string Step { get; set; }
    }
}
