using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Entities;

namespace VocareWebAPI.Billing.Repositories.Interfaces
{
    public interface ITokenTransactionRepository
    {
        Task AddTransactionAsync(TokenTransaction transaction);
    }
}
