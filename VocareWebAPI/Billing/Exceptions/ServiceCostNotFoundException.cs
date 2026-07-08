using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class ServiceCostNotFoundException : NotFoundException
    {
        public string ServiceName { get; }

        public ServiceCostNotFoundException(string serviceName)
            : base($"Service cost for '{serviceName}' not found.", "SERVICE_COST_NOT_FOUND")
        {
            ServiceName = serviceName;
        }
    }
}
