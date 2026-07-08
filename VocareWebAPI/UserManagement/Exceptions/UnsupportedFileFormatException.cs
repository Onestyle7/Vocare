using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class UnsupportedFileFormatException : BusinessRuleException
    {
        public string FileFormat { get; }

        public UnsupportedFileFormatException(string fileFormat)
            : base($"Unsupported file format: {fileFormat}", "UNSUPPORTED_FILE_FORMAT")
        {
            FileFormat = fileFormat;
        }
    }
}
