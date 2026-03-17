namespace BabyTracker.Application.Interfaces;

public interface IFileStorageService
{
    /// <summary>Save a file and return its public URL.</summary>
    Task<string> SaveFileAsync(Stream stream, string fileName, string contentType);
    Task DeleteFileAsync(string url);
}
