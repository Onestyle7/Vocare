using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Shared.Models
{
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public T? Value { get; }
        public string? Error { get; }
        public Dictionary<string, object>? Metadata { get; } // Dodatkowe info

        protected Result(
            bool isSuccess,
            T? value,
            string? error,
            Dictionary<string, object>? metadata = null
        )
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
            Metadata = metadata;
        }

        public static Result<T> Success(T value) => new(true, value, null);

        public static Result<T> Failure(string error) => new(false, default, error);

        public static Result<T> Failure(string error, Dictionary<string, object> metadata) =>
            new(false, default, error, metadata);
    }
}
