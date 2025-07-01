using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Repositories;

namespace VocareWebAPI.CvGenerator.Services.Implementation
{
    public class CvManagementService : ICvManagementService
    {
        private readonly IGeneratedCvRepository _cvRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ICvGenerationService _cvGenerationService;
        private readonly ILogger<CvManagementService> _logger;

        // Na razie hardcode dla developmentu, potem przeniesiemy do konfiguracji
        private const int FREE_TIER_CV_LIMIT = 3;

        public CvManagementService(
            IGeneratedCvRepository cvRepository,
            IUserProfileRepository userProfileRepository,
            ICvGenerationService cvGenerationService,
            ILogger<CvManagementService> logger
        )
        {
            _cvRepository = cvRepository;
            _userProfileRepository = userProfileRepository;
            _cvGenerationService = cvGenerationService;
            _logger = logger;
        }

        public async Task<List<CvListItemDto>> GetUserCvsAsync(string userId)
        {
            _logger.LogInformation("Getting CV list for user: {UserId}", userId);

            var cvs = await _cvRepository.GetUserCvsAsync(userId);

            // Jeśli użytkownik nie ma żadnych CV, automatycznie utwórz pierwsze na podstawie profilu
            if (!cvs.Any())
            {
                _logger.LogInformation(
                    "No CVs found for user {UserId}, creating initial CV from profile",
                    userId
                );

                try
                {
                    var initialCv = await CreateCvAsync(
                        userId,
                        new CreateCvDto
                        {
                            Name = "Moje pierwsze CV",
                            CreateFromProfile = true,
                            Notes = "Automatycznie utworzone na podstawie profilu użytkownika",
                        }
                    );

                    // Pobierz listę ponownie, żeby zwrócić aktualny stan
                    cvs = await _cvRepository.GetUserCvsAsync(userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create initial CV for user {UserId}", userId);
                    // Zwróć pustą listę jeśli nie udało się utworzyć
                    return new List<CvListItemDto>();
                }
            }

            return cvs.Select(cv => new CvListItemDto
                {
                    Id = cv.Id,
                    Name = cv.Name,
                    TargetPosition = cv.TargetPosition,
                    IsDefault = cv.IsDefault,
                    CreatedAt = cv.CreatedAt,
                    LastModifiedAt = cv.LastModifiedAt,
                    Version = cv.Version,
                    Notes = cv.Notes,
                })
                .ToList();
        }

        public async Task<CvDetailsDto> GetCvDetailsAsync(Guid cvId, string userId)
        {
            _logger.LogInformation($"Getting CV details: {cvId} for user: {userId}");

            // Sprawdzamym, czy CV należy do użytkownika
            if (!await _cvRepository.BelongsToUserAsync(cvId, userId))
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission to access this CV."
                );
            }

            var cv = await _cvRepository.GetByIdAsync(cvId);
            if (cv == null)
            {
                throw new KeyNotFoundException($"CV not found. ID: {cvId}");
            }

            var cvData = JsonSerializer.Deserialize<CvDto>(
                cv.CvJson,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            return new CvDetailsDto
            {
                Id = cv.Id,
                Name = cv.Name,
                TargetPosition = cv.TargetPosition,
                CvData = cvData ?? new CvDto(),
                IsDefault = cv.IsDefault,
                CreatedAt = cv.CreatedAt,
                LastModifiedAt = cv.LastModifiedAt,
                Version = cv.Version,
                Notes = cv.Notes,
            };
        }

        public async Task<CvDetailsDto> CreateCvAsync(string userId, CreateCvDto createDto)
        {
            _logger.LogInformation("Creating new CV for user: {UserId}", userId);

            // Sprawdzamy limit CV
            if (!await CanCreateNewCvAsync(userId))
            {
                var limit = await GetMaxCvLimitAsync(userId);
                throw new InvalidOperationException(
                    $"Osiągnięto limit {limit} CV. Usuń istniejące CV lub ulepsz plan."
                );
            }

            CvDto cvData;

            if (createDto.CreateFromProfile)
            {
                // Generujemy CV na podstawie profilu użytkownika
                cvData = await _cvGenerationService.GenerateCvAsync(
                    userId,
                    createDto.TargetPosition
                );
            }
            else if (createDto.InitialData != null)
            {
                // Używamy dostarczonych danych
                cvData = createDto.InitialData;
            }
            else
            {
                // Tworzymy puste CV
                cvData = CreateEmptyCv();
            }

            var cvJson = JsonSerializer.Serialize(
                cvData,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            var generatedCv = new GeneratedCv
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = createDto.Name,
                TargetPosition = createDto.TargetPosition,
                CvJson = cvJson,
                Notes = createDto.Notes,
                IsDefault = false, // Nowe CV nie jest domyślnie ustawione jako default
            };

            // Jeśli to pierwsze CV użytkownika, ustaw jako domyślne
            var existingCvsCount = await _cvRepository.GetUserCvCountAsync(userId);
            if (existingCvsCount == 0)
            {
                generatedCv.IsDefault = true;
            }

            var savedCv = await _cvRepository.AddAsync(generatedCv);

            return new CvDetailsDto
            {
                Id = savedCv.Id,
                Name = savedCv.Name,
                TargetPosition = savedCv.TargetPosition,
                CvData = cvData,
                IsDefault = savedCv.IsDefault,
                CreatedAt = savedCv.CreatedAt,
                LastModifiedAt = savedCv.LastModifiedAt,
                Version = savedCv.Version,
                Notes = savedCv.Notes,
            };
        }

        public async Task<CvDetailsDto> UpdateCvAsync(string userId, UpdateCvDto updateDto)
        {
            _logger.LogInformation("Updating CV: {CvId} for user: {UserId}", updateDto.Id, userId);

            if (!await _cvRepository.BelongsToUserAsync(updateDto.Id, userId))
            {
                throw new UnauthorizedAccessException("CV nie należy do tego użytkownika");
            }

            var cv = await _cvRepository.GetByIdAsync(updateDto.Id);
            if (cv == null)
            {
                throw new KeyNotFoundException($"CV o ID {updateDto.Id} nie zostało znalezione");
            }

            // Aktualizujemy dane
            cv.Name = updateDto.Name;
            cv.TargetPosition = updateDto.TargetPosition;
            cv.Notes = updateDto.Notes;
            cv.CvJson = JsonSerializer.Serialize(
                updateDto.CvData,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            var updatedCv = await _cvRepository.UpdateAsync(cv);

            return new CvDetailsDto
            {
                Id = updatedCv.Id,
                Name = updatedCv.Name,
                TargetPosition = updatedCv.TargetPosition,
                CvData = updateDto.CvData,
                IsDefault = updatedCv.IsDefault,
                CreatedAt = updatedCv.CreatedAt,
                LastModifiedAt = updatedCv.LastModifiedAt,
                Version = updatedCv.Version,
                Notes = updatedCv.Notes,
            };
        }

        public async Task DeleteCvAsync(Guid cvId, string userId)
        {
            _logger.LogInformation("Deleting CV: {CvId} for user: {UserId}", cvId, userId);

            if (!await _cvRepository.BelongsToUserAsync(cvId, userId))
            {
                throw new UnauthorizedAccessException("CV nie należy do tego użytkownika");
            }

            var cv = await _cvRepository.GetByIdAsync(cvId);
            if (cv == null)
            {
                throw new KeyNotFoundException($"CV o ID {cvId} nie zostało znalezione");
            }

            // Jeśli usuwamy domyślne CV, musimy ustawić inne jako domyślne
            if (cv.IsDefault)
            {
                var userCvs = await _cvRepository.GetUserCvsAsync(userId);
                var otherCv = userCvs.FirstOrDefault(c => c.Id != cvId);
                if (otherCv != null)
                {
                    await _cvRepository.SetDefaultAsync(otherCv.Id, userId);
                }
            }

            await _cvRepository.DeactivateAsync(cvId);
        }

        public async Task SetDefaultCvAsync(string userId, Guid cvId)
        {
            _logger.LogInformation("Setting default CV: {CvId} for user: {UserId}", cvId, userId);

            if (!await _cvRepository.BelongsToUserAsync(cvId, userId))
            {
                throw new UnauthorizedAccessException("CV nie należy do tego użytkownika");
            }

            await _cvRepository.SetDefaultAsync(cvId, userId);
        }

        public async Task<bool> CanCreateNewCvAsync(string userId)
        {
            var currentCount = await _cvRepository.GetUserCvCountAsync(userId);
            var maxLimit = await GetMaxCvLimitAsync(userId);

            return currentCount < maxLimit;
        }

        public async Task<int> GetMaxCvLimitAsync(string userId)
        {
            // TODO: W przyszłości można tu sprawdzić poziom subskrypcji użytkownika
            // Na razie zwracamy stały limit dla wersji darmowej
            return FREE_TIER_CV_LIMIT;
        }

        private CvDto CreateEmptyCv()
        {
            return new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = string.Empty,
                    LastName = string.Empty,
                    Email = string.Empty,
                    PhoneNumber = string.Empty,
                    Summary = string.Empty,
                    Location = new CvLocationDto { City = string.Empty, Country = string.Empty },
                },
                Work = new List<CvWorkEntryDto>(),
                Education = new List<CvEducationEntryDto>(),
                Certificates = new List<CvCertificateEntryDto>(),
                Skills = new List<string>(),
                Languages = new List<CvLanguageEntryDto>(),
            };
        }
    }
}
