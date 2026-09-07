using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class TokenPackageNotFoundException : NotFoundException
    {
        public string PriceId { get; }

        public TokenPackageNotFoundException(string priceId)
            : base($"Token package with  priceId '{priceId} not found'.", "TOKEN_PACKAGE_NOT_FOUND")
        { }
    }
}
