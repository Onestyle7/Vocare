using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class InvalidServiceCostException : BusinessRuleException
    {
        public string ServiceName { get; }
        public int InvalidCost { get; }

        public InvalidServiceCostException(string serviceName, int invalidCost)
            : base(
                $"Service cost for '{serviceName}' is not valid: {invalidCost}.",
                "INVALID_SERVICE_COST"
            )
        {
            ServiceName = serviceName;
            InvalidCost = invalidCost;
        }
    }
}
