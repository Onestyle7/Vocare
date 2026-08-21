using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using VocareWebAPI.CvGenerator.Implementations;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Services
{
    public class CvTailoringServiceTests
    {
        private const string UserId = "test-user";

        [Fact]
        public async Task TailorCvAsync_EducationTextDiffersOnlyByCaseAndWhitespace_RestoresCorrectDescriptions()
        {
            var generatedCv = CreateGeneratedCv(
                new CvDto
                {
                    Education =
                    [
                        new CvEducationEntryDto
                        {
                            Institution = "Politechnika Warszawska",
                            Degree = "Inżynier",
                            Field = "Informatyka",
                            StartDate = "2018-10-01",
                            EndDate = "2022-06-30",
                            Description = "Opis studiów inżynierskich",
                        },
                        new CvEducationEntryDto
                        {
                            Institution = "Politechnika Warszawska",
                            Degree = "Magister",
                            Field = "Analiza danych",
                            StartDate = "2018-10-01",
                            EndDate = "2022-06-30",
                            Description = "Opis studiów magisterskich",
                        },
                    ],
                }
            );
            var tailoredCv = new CvDto
            {
                Education =
                [
                    new CvEducationEntryDto
                    {
                        Institution = " politechnika warszawska ",
                        Degree = " MAGISTER ",
                        Field = " ANALIZA DANYCH ",
                        StartDate = "2018-10-01",
                        EndDate = "2022-06-30",
                        Description = "Opis zwrócony przez AI",
                    },
                    new CvEducationEntryDto
                    {
                        Institution = "POLITECHNIKA WARSZAWSKA",
                        Degree = "inżynier",
                        Field = " informatyka ",
                        StartDate = "2018-10-01",
                        EndDate = "2022-06-30",
                        Description = "Inny opis zwrócony przez AI",
                    },
                ],
            };
            var (service, repository) = CreateService(generatedCv, tailoredCv);

            var result = await service.TailorCvAsync(
                new TailorCvDto { CvId = generatedCv.Id, JobDescription = "Oferta pracy" },
                UserId
            );

            Assert.Collection(
                result.CvData.Education,
                education =>
                    Assert.Equal("Opis studiów magisterskich", education.Description),
                education => Assert.Equal("Opis studiów inżynierskich", education.Description)
            );
            repository.Verify(x => x.UpdateAsync(generatedCv), Times.Once);
        }

        [Fact]
        public async Task TailorCvAsync_FallbackInstitutionDiffersOnlyByCaseAndWhitespace_RestoresDescription()
        {
            var generatedCv = CreateGeneratedCv(
                new CvDto
                {
                    Education =
                    [
                        new CvEducationEntryDto
                        {
                            Institution = "Politechnika Warszawska",
                            Degree = "Inżynier",
                            Field = "Informatyka",
                            StartDate = "2018-10-01",
                            EndDate = "2022-06-30",
                            Description = "Opis ze źródłowego CV",
                        },
                    ],
                }
            );
            var tailoredCv = new CvDto
            {
                Education =
                [
                    new CvEducationEntryDto
                    {
                        Institution = " politechnika warszawska ",
                        Degree = "Bachelor of Science",
                        Field = "Computer Science",
                        StartDate = "2018-10-01",
                        EndDate = "2022-06-30",
                        Description = "Opis zwrócony przez AI",
                    },
                ],
            };
            var (service, _) = CreateService(generatedCv, tailoredCv);

            var result = await service.TailorCvAsync(
                new TailorCvDto { CvId = generatedCv.Id, JobDescription = "Oferta pracy" },
                UserId
            );

            Assert.Equal("Opis ze źródłowego CV", result.CvData.Education[0].Description);
        }

        private static GeneratedCv CreateGeneratedCv(CvDto sourceCv) =>
            new()
            {
                Id = Guid.NewGuid(),
                UserId = UserId,
                Name = "Test CV",
                CvJson = JsonSerializer.Serialize(sourceCv),
            };

        private static (
            CvTailoringService Service,
            Mock<IGeneratedCvRepository> Repository
        ) CreateService(GeneratedCv generatedCv, CvDto tailoredCv)
        {
            var repository = new Mock<IGeneratedCvRepository>();
            repository.Setup(x => x.GetByIdAsync(generatedCv.Id)).ReturnsAsync(generatedCv);
            repository
                .Setup(x => x.BelongsToUserAsync(generatedCv.Id, UserId))
                .ReturnsAsync(true);
            repository
                .Setup(x => x.UpdateAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            var apiResponse = new
            {
                choices = new[]
                {
                    new
                    {
                        message = new { content = JsonSerializer.Serialize(tailoredCv) },
                    },
                },
            };
            var httpMessageHandler = new Mock<HttpMessageHandler>();
            httpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            JsonSerializer.Serialize(apiResponse),
                            Encoding.UTF8,
                            "application/json"
                        ),
                    }
                );

            var service = new CvTailoringService(
                new HttpClient(httpMessageHandler.Object),
                repository.Object,
                Mock.Of<ILogger<CvTailoringService>>(),
                Options.Create(
                    new OpenAIConfig { ApiKey = "test-key", Model = "test-model" }
                ),
                Mock.Of<IUserProfileRepository>(),
                Mock.Of<ICvManagementService>(),
                null!
            );

            return (service, repository);
        }
    }
}
