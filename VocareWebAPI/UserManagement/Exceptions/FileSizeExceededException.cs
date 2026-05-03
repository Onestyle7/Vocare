using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class FileSizeExceededException : BusinessRuleException
    {
        public long FileSize { get; }
        public long MaxAllowedSize { get; }

        public FileSizeExceededException(long fileSize, long maxAllowedSize)
            : base(
                $"File size {fileSize} exceeds the maximum allowed size of {maxAllowedSize}.",
                "FILE_SIZE_EXCEEDED"
            )
        {
            FileSize = fileSize;
            MaxAllowedSize = maxAllowedSize;
        }
    }
}
