using Pgvector;

namespace VocareWebAPI.Shared.Services.Interfaces
{
    /// <summary>
    /// Seris do generowania embeddingów (wektorowa reprezentacja tekstu)
    /// Embeding pozwoli na semantyczne porównywanie tekstów
    /// </summary>
    public interface IEmbeddingService
    {
        /// <summary>
        /// Generuje embedding (wektor 1536 liczb) dla podanego tekstu
        /// </summary>
        /// <param name="text">Tekst do przetworzenia (np. oferta pracy)</param>
        /// <returns>Wektor reprezentujący znaczenie tekstu</returns>
        Task<Vector> GenerateEmbeddingAsync(string text);

        /// <summary>
        /// Generuje embeddingi dla wielu tekstów w jednym zapytaniu
        /// </summary>
        /// <param name="texts"></param>
        /// <returns></returns>
        Task<IList<Vector>> GenerateEmbeddingsAsync(IList<string> texts);
    }
}
