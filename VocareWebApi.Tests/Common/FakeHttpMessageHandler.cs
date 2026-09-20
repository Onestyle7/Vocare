using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Konfigurowalny <see cref="HttpMessageHandler"/> do testowania serwisów opartych o <see cref="HttpClient"/>.
    /// Pozwala kolejkować odpowiedzi, wskazać stały wynik lub delegat, a także przechwytuje
    /// wszystkie wysłane żądania do późniejszej asercji.
    /// </summary>
    public sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<
            HttpRequestMessage,
            CancellationToken,
            Task<HttpResponseMessage>
        > _responder;

        public List<HttpRequestMessage> Requests { get; } = new();

        public List<string?> RequestBodies { get; } = new();

        public int CallCount => Requests.Count;

        public HttpRequestMessage? LastRequest => Requests.Count == 0 ? null : Requests[^1];

        public string? LastRequestBody => RequestBodies.Count == 0 ? null : RequestBodies[^1];

        public FakeHttpMessageHandler(
            Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder
        )
        {
            _responder = responder ?? throw new ArgumentNullException(nameof(responder));
        }

        /// <summary>Zawsze zwraca tę samą odpowiedź.</summary>
        public static FakeHttpMessageHandler Returning(HttpResponseMessage response) =>
            new((_, _) => Task.FromResult(response));

        /// <summary>Zwraca odpowiedź o wskazanym statusie z podanym ciałem tekstowym.</summary>
        public static FakeHttpMessageHandler Returning(
            HttpStatusCode statusCode,
            string content,
            string mediaType = "application/json"
        ) =>
            new(
                (_, _) =>
                    Task.FromResult(
                        new HttpResponseMessage(statusCode)
                        {
                            Content = new StringContent(content, Encoding.UTF8, mediaType),
                        }
                    )
            );

        /// <summary>Serializuje <paramref name="payload"/> do JSON i zwraca jako odpowiedź 200 OK.</summary>
        public static FakeHttpMessageHandler ReturningJson(
            object payload,
            HttpStatusCode statusCode = HttpStatusCode.OK
        ) =>
            new(
                (_, _) =>
                    Task.FromResult(
                        new HttpResponseMessage(statusCode)
                        {
                            Content = new StringContent(
                                JsonSerializer.Serialize(payload),
                                Encoding.UTF8,
                                "application/json"
                            ),
                        }
                    )
            );

        /// <summary>Rzuca wskazany wyjątek przy każdej próbie wysłania żądania.</summary>
        public static FakeHttpMessageHandler Throwing(Exception exception) =>
            new((_, _) => throw exception);

        /// <summary>Odtwarza kolejno przekazane odpowiedzi; po wyczerpaniu powtarza ostatnią.</summary>
        public static FakeHttpMessageHandler Sequence(params HttpResponseMessage[] responses)
        {
            if (responses is null || responses.Length == 0)
                throw new ArgumentException(
                    "At least one response is required.",
                    nameof(responses)
                );

            var index = 0;
            return new(
                (_, _) =>
                {
                    var response = responses[Math.Min(index, responses.Length - 1)];
                    index++;
                    return Task.FromResult(response);
                }
            );
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken
        )
        {
            Requests.Add(request);
            RequestBodies.Add(
                request.Content is null
                    ? null
                    : await request.Content.ReadAsStringAsync(cancellationToken)
            );
            return await _responder(request, cancellationToken);
        }
    }
}
