namespace VocareWebAPI.Shared.Results
{
    public record Result<T>(bool IsSuccess, T? Value, Error? Error)
    {
        public static Result<T> Ok(T value) => new(IsSuccess: true, Value: value, Error: null);

        public static Result<T> Fail(Error error) =>
            new(IsSuccess: false, Value: default, Error: error);
    }
}
